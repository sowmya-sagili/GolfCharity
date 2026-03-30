'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  CheckCircle2, 
  Clock, 
  XSquare, 
  Search, 
  Loader2,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Winner {
  id: string
  match_type: number
  proof_url: string
  payment_status: string
  created_at: string
  email: string
  winning_numbers: number[]
}

export default function AdminWinners() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewProof, setViewProof] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchWinners()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('winners_admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'winners'
        },
        () => {
          fetchWinners()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchWinners = async () => {
    setLoading(true)
    const { data: winners, error } = await supabase.rpc('get_all_winners')

    if (error) {
      console.error('Error fetching winners:', error?.message || error)
    } else {
      setWinners(winners || [])
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('winners')
        .update({ payment_status: newStatus })
        .eq('id', id)
      
      if (error) throw error
      
      // Update local state is handled by real-time fetch but we do it aggressively here
      setWinners(winners.map(w => 
        w.id === id ? { ...w, payment_status: newStatus } : w
      ))
    } catch (error: any) {
      alert(`Error updating winner status: ${error.message}`)
    }
  }

  const filteredWinners = winners.filter(w => 
    w.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTierAmount = (tier: number) => {
    switch(tier) {
      case 5: return 180000.00
      case 4: return 12500.00
      case 3: return 1240.50
      default: return 0
    }
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div className="space-y-2">
            <h1 className="text-4xl font-black outfit text-accent">Winner Verification</h1>
            <p className="text-secondary font-medium uppercase tracking-widest text-[10px]">Moderate proof submissions and manage distributions.</p>
         </div>
         
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-72">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
               <input 
                  type="text" 
                  placeholder="Search by winner email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-12 py-3 text-sm focus:border-accent outline-none font-medium"
               />
            </div>
         </div>
      </header>

      {/* Winners Table */}
      <div className="glass overflow-hidden border-border bg-card-bg/10">
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                 <tr className="border-b border-border bg-white/5">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60">Golfer / Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60">Match Tier</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60">Draw Numbers</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60 text-right">Moderation</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                 <AnimatePresence mode="popLayout">
                  {loading && winners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
                      </td>
                    </tr>
                  ) : filteredWinners.length > 0 ? (
                    filteredWinners.map((w) => (
                      <motion.tr 
                         key={w.id}
                         layout
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                         className="group transition-colors"
                      >
                         <td className="px-6 py-6 font-bold text-sm">
                            <div className="flex flex-col">
                               <span className="truncate max-w-[200px]">{w.email}</span>
                               <span className="text-[10px] font-medium text-secondary/60 uppercase tracking-widest">
                                 {new Date(w.created_at).toLocaleDateString()}
                               </span>
                            </div>
                         </td>
                         <td className="px-6 py-6 font-black outfit text-sm">
                            <div className="flex items-center gap-2">
                               <Trophy className={`w-4 h-4 ${w.match_type === 5 ? 'text-accent' : 'text-secondary'}`} />
                               {w.match_type}-Match
                            </div>
                         </td>
                         <td className="px-6 py-6">
                            <div className="flex gap-1">
                               {w.winning_numbers?.map((n) => (
                                 <span key={n} className="w-6 h-6 rounded bg-black/40 border border-border flex items-center justify-center text-[10px] font-black text-accent">
                                   {n}
                                 </span>
                               ))}
                            </div>
                         </td>
                         <td className="px-6 py-6 font-black text-accent text-sm">
                            £{getTierAmount(w.match_type).toLocaleString()}
                         </td>
                         <td className="px-6 py-6">
                            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                               w.payment_status === 'paid' ? 'text-golf-green' : w.payment_status === 'rejected' ? 'text-red-500' : 'text-orange-500'
                            }`}>
                               {w.payment_status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : w.payment_status === 'rejected' ? <XSquare className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                               {w.payment_status}
                            </div>
                         </td>
                         <td className="px-6 py-6 text-right">
                            <div className="flex items-center justify-end gap-4">
                               {w.proof_url && (
                                 <button 
                                   onClick={() => setViewProof(w.proof_url)}
                                   className="p-2 rounded-lg bg-white/5 hover:bg-accent hover:text-background transition-all"
                                   title="View Proof Screenshot"
                                 >
                                    <ImageIcon className="w-4 h-4" />
                                 </button>
                               )}
                               {w.payment_status === 'pending' && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <button 
                                      onClick={() => updateStatus(w.id, 'paid')}
                                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-golf-green/10 text-golf-green hover:bg-golf-green text-xs font-black outfit uppercase tracking-widest transition-all hover:text-background"
                                    >
                                      <CheckCircle2 className="w-4 h-4" /> Approve
                                    </button>
                                    <button 
                                      onClick={() => updateStatus(w.id, 'rejected')}
                                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 text-xs font-black outfit uppercase tracking-widest transition-all hover:text-white"
                                    >
                                      <XSquare className="w-4 h-4" /> Reject
                                    </button>
                                    <div className="col-span-2 pt-4 border-t border-border/50">
                                      <button 
                                        onClick={() => setViewProof(w.proof_url)}
                                        className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors"
                                      >
                                          <ExternalLink className="w-3 h-3" /> View Proof Screenshot
                                      </button>
                                    </div>
                                  </div>
                               )}
                            </div>
                         </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-secondary font-bold uppercase tracking-widest text-xs">
                        No submissions to verify
                      </td>
                    </tr>
                  )}
                 </AnimatePresence>
              </tbody>
           </table>
         </div>
      </div>

      {/* Proof Modal Overlay */}
      <AnimatePresence>
        {viewProof && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-8 backdrop-blur-xl">
              <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="relative max-w-4xl w-full h-[80vh] bg-black rounded-3xl overflow-hidden border border-border"
              >
                 <img src={viewProof} className="w-full h-full object-contain" alt="Full Proof" />
                 <button 
                    onClick={() => setViewProof(null)}
                    className="absolute top-8 right-8 btn-primary px-8"
                 >
                    Close Proof
                 </button>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  )
}
