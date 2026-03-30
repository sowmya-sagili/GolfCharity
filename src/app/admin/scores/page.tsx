'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  User, 
  Calendar,
  Trophy,
  Search,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface PendingScore {
  id: string
  score: number
  date: string
  status: string
  email: string
}

export default function AdminScoreVerification() {
  const [scores, setScores] = useState<PendingScore[]>([])
  const [loading, setLoading] = useState(true)
  const [viewProof, setViewProof] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchPendingScores()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('golf_scores_admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'golf_scores',
          filter: 'status=eq.pending'
        },
        () => {
          fetchPendingScores()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPendingScores = async () => {
    setLoading(true)
    const { data: scores, error } = await supabase.rpc('get_all_scores_with_user_info')

    if (error) {
      console.error('Error fetching scores:', error?.message || error)
    } else {
      setScores(scores || [])
    }
    setLoading(false)
  }

  const handleVerify = async (id: string, approve: boolean) => {
    const newStatus = approve ? 'verified' : 'rejected'
    
    try {
      const { error } = await supabase
        .from('golf_scores')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) throw error
      
      // Update local state
      setScores(scores.filter(s => s.id !== id))
    } catch (error: any) {
      alert(`Error updating score: ${error.message}`)
    }
  }

  const filteredScores = scores.filter(s => 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-12">
      <header className="space-y-2">
         <h1 className="text-4xl font-black outfit text-accent">Score Verification</h1>
         <p className="text-secondary font-medium uppercase tracking-widest text-[10px]">Moderate submitted rounds for draw eligibility.</p>
      </header>

      {/* Stats and Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <AlertCircle className="w-5 h-5 text-orange-400" />
               <div className="text-sm font-black outfit">{scores.length} Pending Moderations</div>
            </div>
            <div className="flex items-center gap-3">
               <CheckCircle className="w-5 h-5 text-golf-green" />
               <div className="text-sm font-black outfit">Automated Verification Active</div>
            </div>
         </div>

         <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
            <input 
               type="text" 
               placeholder="Search by golfer email..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-black/40 border border-border rounded-xl px-12 py-3 text-sm focus:border-accent outline-none font-medium"
            />
         </div>
      </div>

      {/* Verification Queue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : filteredScores.length > 0 ? (
            filteredScores.map((s) => (
              <motion.div 
                 key={s.id}
                 layout
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="glass overflow-hidden group border-border hover:border-accent/40 transition-all bg-card-bg/20"
              >
                 {/* Proof Placeholder/Preview */}
                 <div className="h-48 relative overflow-hidden bg-black/40 flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-secondary/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                       <div className="text-3xl font-black outfit text-white tracking-tighter shadow-xl">
                          {s.score} <span className="text-xs uppercase tracking-widest font-black text-white/60">Points</span>
                       </div>
                    </div>
                 </div>

                 {/* Score Details */}
                 <div className="p-6 space-y-6">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                          <User className="w-4 h-4 text-secondary" />
                          <span className="truncate">{s.email}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs font-medium text-secondary">
                             <Calendar className="w-4 h-4" /> {new Date(s.date).toLocaleDateString()}
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <button 
                          onClick={() => handleVerify(s.id, true)}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-golf-green/10 text-golf-green hover:bg-golf-green text-xs font-black outfit uppercase tracking-widest transition-all hover:text-background"
                       >
                          <CheckCircle className="w-4 h-4" /> Approve
                       </button>
                       <button 
                          onClick={() => handleVerify(s.id, false)}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 text-xs font-black outfit uppercase tracking-widest transition-all hover:text-white"
                       >
                          <XCircle className="w-4 h-4" /> Reject
                       </button>
                    </div>
                 </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass border-dashed bg-white/5">
              <CheckCircle className="w-12 h-12 text-secondary/20 mx-auto mb-4" />
              <p className="text-secondary font-bold uppercase tracking-widest text-xs">No pending scores to verify</p>
            </div>
          )}
         </AnimatePresence>
      </div>
    </div>
  )
}
