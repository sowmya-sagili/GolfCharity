'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Trophy, Calendar, CheckCircle2, Clock, XCircle, ExternalLink, Wallet, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function WinningsPage() {
  const [winnings, setWinnings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchWinnings()
  }, [])

  // src/app/dashboard/winnings/page.tsx
  const fetchWinnings = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('User not authenticated');
      const userId = user.id;

      // Fetch profile to check admin status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;

      if (profile?.is_admin) {
        // Admin: Fetch all via RPC to avoid RLS recursion
        const { data: allWinnings, error: adminError } = await supabase
          .rpc('get_all_winners_admin');
        
        if (adminError) throw adminError;
        setWinnings(allWinnings || []);
      } else {
        // Regular User: Fetch own winnings
        const { data: userWinnings, error: userError } = await supabase
          .from('winners')
          .select('*, draws(draw_date)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (userError) throw userError;
        setWinnings(userWinnings || []);
      }
    } catch (err: any) {
      console.error('Error fetching winnings:', JSON.stringify(err, null, 2));
      setError('Unable to load winnings. Please try again.');
      setWinnings([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black outfit text-accent">My Winnings</h1>
        <p className="text-secondary font-medium uppercase tracking-widest text-[10px]">Track your prize draw history and payout status.</p>
      </header>

      {winnings && winnings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {winnings.map((win) => (
            <div
              key={win.id}
              className="glass p-8 bg-card-bg/10 border-border/40 hover:border-accent/40 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-8"
            >
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${win.match_type === 5 ? 'bg-accent/10 border-accent/20' : 'bg-white/5 border-white/10'
                  }`}>
                  <Trophy className={`w-8 h-8 ${win.match_type === 5 ? 'text-accent' : 'text-secondary'}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/60">
                    <Calendar className="w-3 h-3" />
                    {win.draws ? new Date(win.draws.draw_date).toLocaleDateString() : 'N/A'}
                  </div>
                  <h3 className="text-xl font-black outfit">{win.match_type}-Match Winner</h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8 md:gap-12">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Payout Status</div>
                  <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${win.payment_status === 'paid' ? 'text-golf-green' : win.payment_status === 'rejected' ? 'text-red-500' : 'text-orange-500'
                    }`}>
                    {win.payment_status === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : win.payment_status === 'rejected' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {win.payment_status}
                  </div>
                </div>

                <div className="space-y-1 min-w-[120px]">
                  <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Actions</div>
                  {win.proof_url ? (
                    <a
                      href={win.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-accent hover:underline"
                    >
                      View Proof <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-secondary/40 font-medium italic">Pending Verification</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-20 text-center space-y-6 bg-white/5 border-dashed border-border/40">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <Wallet className="w-10 h-10 text-secondary/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold outfit">No winnings yet</h3>
            <p className="text-secondary text-sm font-medium">Keep playing! Your next round could be the big one.</p>
          </div>
          <Link href="/dashboard/scores" className="btn-secondary py-3 px-8 text-xs inline-block">
            Enter New Scores
          </Link>
        </div>
      )}
    </div>
  )
}
