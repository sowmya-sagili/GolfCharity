'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
   PlusCircle,
   History,
   Upload,
   Trash2,
   AlertCircle,
   CheckCircle2,
   Calendar,
   Trophy,
   Loader2,
   Clock,
   XCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface ScoreEntry {
   id: string
   score: number
   date: string
   status: string
   created_at: string
}

export default function ScoresPage() {
   const [score, setScore] = useState('')
   const [date, setDate] = useState(new Date().toISOString().split('T')[0])
   const [file, setFile] = useState<File | null>(null)
   const [loading, setLoading] = useState(false)
   const [historyLoading, setHistoryLoading] = useState(true)
   const [scores, setScores] = useState<ScoreEntry[]>([])
   const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

   const supabase = createClient()

   useEffect(() => {
      fetchScoreHistory()
   }, [])

   // src/app/dashboard/scores/page.tsx
   const fetchScoreHistory = async () => {
      setHistoryLoading(true);
      setMessage(null);

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
            const { data: allScores, error: adminError } = await supabase
               .rpc('get_all_scores_admin');
            
            if (adminError) throw adminError;
            setScores(allScores || []);
         } else {
            // Regular User: Fetch own scores (RLS handles this but explicit filter is safer)
            const { data: userScores, error: userError } = await supabase
               .from('golf_scores')
               .select('*')
               .eq('user_id', userId)
               .order('date', { ascending: false });

            if (userError) throw userError;
            setScores(userScores || []);
         }
      } catch (err: any) {
         console.error('[Scores Fetch Error]:', JSON.stringify(err, null, 2));
         setMessage({ type: 'error', text: 'Failed to load score history. Please try again.' });
         setScores([]);
      } finally {
         setHistoryLoading(false);
      }
   };

   const handleScoreSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setMessage(null)

      try {
         const scoreVal = parseInt(score)
         if (scoreVal < 1 || scoreVal > 45) {
            throw new Error('Score must be between 1 and 45 (Stableford).')
         }

         if (!file) {
            throw new Error('Please upload a screenshot of your scorecard as proof.')
         }

         // 0. Get current user
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) throw new Error('You must be logged in to submit a score.')

         // 1. Upload proof to Supabase Storage in user-specific folder
         const fileExt = file.name.split('.').pop()
         const fileName = `${Math.random()}.${fileExt}`
         const filePath = `${user.id}/${fileName}`

         const { data: uploadData, error: uploadError } = await supabase.storage
            .from('proofs')
            .upload(filePath, file)

         if (uploadError) throw uploadError

         // 2. Insert score to DB (Using standardized pattern)
         const { error: dbError } = await supabase
            .from('golf_scores')
            .insert([
               {
                  user_id: user.id,
                  score: scoreVal,
                  date: date
               }
            ])

         if (dbError) throw dbError

         setMessage({ type: 'success', text: 'Score submitted successfully! It will be verified shortly.' })
         setScore('')
         setFile(null)
         fetchScoreHistory() // Refresh history
      } catch (err: any) {
         setMessage({ type: 'error', text: err.message })
      } finally {
         setLoading(false)
      }
   }

   return (
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
         <div className="flex items-end justify-between">
            <div className="space-y-4">
               <h1 className="text-4xl font-black outfit gradient-text">Score Management</h1>
               <p className="text-secondary font-medium">Keep your latest 5 rounds active to maximize your draw chances.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Score Entry form */}
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="glass p-10 space-y-8"
            >
               <div className="flex items-center gap-3">
                  <PlusCircle className="w-6 h-6 text-accent" />
                  <h2 className="text-2xl font-black outfit">Submit New Round</h2>
               </div>

               {message && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${message.type === 'success' ? 'bg-golf-green/10 text-golf-green' : 'bg-red-500/10 text-red-500'
                     }`}>
                     {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                     <p>{message.text}</p>
                  </div>
               )}

               <form onSubmit={handleScoreSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Stableford Score (1-45)</label>
                        <div className="relative">
                           <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                           <input
                              type="number"
                              value={score}
                              onChange={(e) => setScore(e.target.value)}
                              min="1"
                              max="45"
                              placeholder="36"
                              className="w-full bg-black/40 border border-border rounded-xl px-12 py-4 focus:border-accent outline-none"
                              required
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Round Date</label>
                        <div className="relative">
                           <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                           <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="w-full bg-black/40 border border-border rounded-xl px-12 py-4 focus:border-accent outline-none"
                              required
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Proof of Score (Screenshot)</label>
                     <div className="relative border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 hover:border-accent/40 bg-black/20 text-center transition-all cursor-pointer group">
                        {file ? (
                           <div className="flex items-center gap-4 text-accent font-bold text-center">
                              <CheckCircle2 className="w-6 h-6" />
                              <span className="truncate max-w-[200px]">{file.name}</span>
                              <button type="button" onClick={() => setFile(null)} className="text-red-500 hover:scale-110 transition-transform">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        ) : (
                           <>
                              <Upload className="w-10 h-10 text-secondary group-hover:text-accent transition-colors" />
                              <div className="space-y-1">
                                 <p className="font-bold text-sm">Upload Scan or Image</p>
                                 <p className="text-[10px] text-secondary/60">Upload a single PNG or JPG up to 5MB</p>
                              </div>
                              <input
                                 type="file"
                                 className="absolute inset-0 opacity-0 cursor-pointer"
                                 onChange={(e) => setFile(e.target.files?.[0] || null)}
                                 accept="image/*"
                              />
                           </>
                        )}
                     </div>
                  </div>

                  <button
                     type="submit"
                     disabled={loading}
                     className="btn-primary w-full py-4 text-lg font-black outfit disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                     {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify and Add Score'}
                  </button>
               </form>
            </motion.div>

            {/* Score History List */}
            <div className="space-y-8">
               <div className="glass overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                     <h3 className="font-black outfit text-sm uppercase tracking-widest flex items-center gap-2">
                        <History className="w-4 h-4" /> My Latest Rounds
                     </h3>
                  </div>

                  <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                     {historyLoading ? (
                        <div className="p-10 flex justify-center">
                           <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                        </div>
                     ) : scores.length > 0 ? (
                        scores.map((s) => (
                           <div key={s.id} className="p-6 flex items-center justify-between group hover:bg-border/20 transition-all">
                              <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-black outfit text-lg">
                                    {s.score}
                                 </div>
                                 <div className="space-y-0.5">
                                    <div className="text-xs font-bold text-foreground">Stableford Round</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                                       {new Date(s.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                 </div>
                              </div>
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${s.status === 'verified' ? 'bg-golf-green/10 text-golf-green' :
                                    s.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                       'bg-orange-500/10 text-orange-500'
                                 }`}>
                                 {s.status === 'verified' ? <CheckCircle2 className="w-3 h-3" /> :
                                    s.status === 'rejected' ? <XCircle className="w-3 h-3" /> :
                                       <Clock className="w-3 h-3" />}
                                 {s.status}
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="p-20 text-center space-y-4">
                           <History className="w-12 h-12 text-secondary/20 mx-auto" />
                           <div className="space-y-1">
                              <p className="text-xs font-bold text-secondary">No rounds submitted yet</p>
                              <p className="text-[10px] uppercase tracking-widest text-secondary/40">Your history will appear here</p>
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               {/* Helpful Note */}
               <div className="glass p-8 bg-blue-500/5 border-blue-500/20">
                  <div className="flex items-start gap-4">
                     <AlertCircle className="w-6 h-6 text-blue-400 mt-1" />
                     <div className="space-y-2">
                        <p className="font-bold text-sm text-blue-400">Stableford Format Only</p>
                        <p className="text-xs text-secondary font-medium">Please ensure scores are entered in the Stableford format (typically 0-45+). Conventional stroke play scores will be rejected during verification.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   )
}
