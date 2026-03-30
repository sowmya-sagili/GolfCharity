'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Target,
  Heart,
  PlusCircle,
  ChevronRight,
  TrendingUp,
  History,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Profile {
  id: string
  subscription_status: string
  current_charity_id: string
  charity_percentage: number
  is_admin?: boolean
  charities?: {
    name: string
    description: string
    total_raised: number
  }
}

interface Score {
  id: string
  score: number
  date: string
  status: string
  created_at: string
}

interface WinningsSummary {
  total_won: number
  win_count: number
}

export default function DashboardOverview() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [scores, setScores] = useState<Score[]>([])
  const [winnings, setWinnings] = useState<WinningsSummary>({ total_won: 0, win_count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // src/app/dashboard/page.tsx
  // src/app/dashboard/page.tsx
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.warn('Dashboard accessed without active session. Redirecting to login.');
        router.push('/login');
        return;
      }
      
      const userId = user.id;

      // 1. Fetch the profile of the logged-in user (Personal View)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, charities(*)')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as any);

      // Admin logic: Use RPC to bypass RLS recursion if needed for all-data views
      if (profileData?.is_admin) {
        const { data: allProfiles, error: rpcError } = await supabase
          .rpc('get_all_profiles_for_admin');
        
        if (rpcError) throw rpcError;
        // This validates the admin connection but for this specific personal dashboard 
        // we primarily focus on the user's own stats. 
        // Logic for admin-specific views would go here.
      }

      // 2. Fetch Scores
      let scoreData;
      if (profileData?.is_admin) {
        const { data, error } = await supabase.rpc('get_all_scores_admin');
        if (error) throw error;
        scoreData = data;
      } else {
        const { data, error } = await supabase
          .from('golf_scores')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) throw error;
        scoreData = data;
      }
      setScores(scoreData || []);

      // 3. Fetch Winnings Summary
      let winningData;
      if (profileData?.is_admin) {
        const { data, error } = await supabase.rpc('get_all_winners_admin');
        if (error) throw error;
        winningData = data;
      } else {
        const { data, error } = await supabase
          .from('winners')
          .select('match_type, payment_status')
          .eq('user_id', userId)
          .eq('payment_status', 'paid');
        if (error) throw error;
        winningData = data;
      }

      if (winningData) {
        const getTierAmount = (tier: number) => {
          switch(tier) {
            case 5: return 180000.00;
            case 4: return 12500.00;
            case 3: return 1240.50;
            default: return 0;
          }
        };

        const total = winningData.reduce((acc: number, curr: any) => acc + getTierAmount(curr.match_type), 0);
        setWinnings({ total_won: total, win_count: winningData.length });
      }

    } catch (errValue: any) {
      console.error('Detailed Dashboard Error:', errValue);
      // Construct a more helpful message from the error object if possible
      const msg = errValue?.message || 'An error occurred while loading your dashboard.';
      setError(`${msg} If this persists, please ensure you have run the required database setup (final_fix.sql).`);
      setProfile(null);
      setScores([]);
      setWinnings({ total_won: 0, win_count: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const averageScore = scores.length > 0
    ? (scores.reduce((acc, s) => acc + s.score, 0) / scores.length).toFixed(1)
    : '0.0'

  const fadeIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6 }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header with quick stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black outfit gradient-text">Dashboard</h1>
          <p className="text-secondary font-medium uppercase tracking-widest text-xs font-bold">
            Welcome back, {profile?.subscription_status === 'active' ? 'Active Member' : 'Golfer'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/scores" className="btn-primary py-3 px-6 text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Add New Score
          </Link>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-grow">
            <p className="text-sm font-bold">{error}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setError(null); fetchDashboardData(); }}
              className="text-[10px] font-black uppercase tracking-widest bg-red-500/20 px-3 py-1 rounded-full hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleLogout}
              className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-colors"
            >
              Logout
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div
              {...fadeIn}
              className="glass p-6 bg-accent/5 border-accent/20"
            >
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-accent" />
                <TrendingUp className="w-4 h-4 text-golf-green" />
              </div>
              <div className="text-3xl font-black outfit">{averageScore}</div>
              <div className="text-[10px] uppercase tracking-widest font-black text-secondary">Average Score</div>
            </motion.div>

            <motion.div
              {...fadeIn}
              transition={{ delay: 0.1 }}
              className="glass p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-accent" />
                <TrendingUp className="w-4 h-4 text-golf-green" />
              </div>
              <div className="text-3xl font-black outfit">£{winnings.total_won.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-widest font-black text-secondary">Total Winnings</div>
            </motion.div>

            <motion.div
              {...fadeIn}
              transition={{ delay: 0.2 }}
              className="glass p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-3xl font-black outfit">
                {scores.length >= 5 ? 'Qualified' : `${scores.length}/5`}
              </div>
              <div className={`text-[10px] uppercase tracking-widest font-black ${scores.length >= 5 ? 'text-golf-green' : 'text-secondary'}`}>
                Draw Eligibility
              </div>
            </motion.div>
          </div>

          {/* Current Charity Impact */}
          <motion.div
            {...fadeIn}
            className="glass p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
              <Heart className="w-40 h-40 text-red-500" />
            </div>

            <div className="relative z-10 space-y-6 max-w-lg">
              <div className="space-y-1">
                <h3 className="text-lg font-black outfit uppercase tracking-widest text-accent">Charity Partner</h3>
                <h2 className="text-3xl font-black outfit">{profile?.charities?.name || 'No Charity Selected'}</h2>
              </div>
              <p className="text-secondary font-medium text-sm">
                {profile?.charities?.description || 'Pick a charity to start making an impact with every round you play.'}
              </p>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-black outfit">£{(profile?.charities?.total_raised || 0).toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-widest font-black text-secondary">Total Raised Globally</div>
              </div>
              <Link href="/dashboard/charity" className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline">
                {profile?.charities ? 'View Impact Report' : 'Select Charity Partner'} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Status Column */}
        <div className="space-y-8">
          {/* Latest Scores Card */}
          <div className="glass overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-black outfit text-sm uppercase tracking-widest">Rolling 5 Scores</h3>
              <Link href="/dashboard/scores" className="text-[10px] font-black uppercase text-secondary hover:text-accent tracking-tighter transition-all">View All</Link>
            </div>

            <div className="divide-y divide-border/50">
              {scores.length > 0 ? scores.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between group hover:bg-border/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-black outfit text-sm">
                      {s.score}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Score Added</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">{new Date(s.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${s.status === 'verified' ? 'bg-golf-green/20 text-golf-green' : 'bg-orange-500/20 text-orange-500'
                    }`}>
                    {s.status}
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center space-y-2">
                  <History className="w-8 h-8 text-secondary/20 mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary/60">No scores yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Next Draw Participation */}
          <div className="glass p-6 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black outfit text-sm uppercase tracking-widest text-indigo-400">Next Monthly Draw</h3>
              </div>
              <div>
                <div className="text-2xl font-black outfit">April 1st, 2026</div>
                <div className="text-xs font-bold text-secondary">
                  {scores.length >= 1 ? 'Participation confirmed.' : 'Add at least 1 score to qualify.'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-border/50 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-secondary">
                  <span>Prize Tier</span>
                  <span>Pot Share</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span>5-Match Jackpot</span>
                  <span className="text-accent">£180,000.00</span>
                </div>
              </div>
              <Link href="/monthly-draws" className="btn-secondary w-full py-3 text-xs tracking-widest uppercase text-center flex items-center justify-center">
                View Live Simulation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
