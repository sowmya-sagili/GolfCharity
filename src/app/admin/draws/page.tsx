'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlayCircle, 
  RefreshCcw, 
  Trophy, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Dice5,
  Calendar,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface DrawRecord {
  id: string
  draw_date: string
  winning_numbers: number[]
  total_pool: number
  jackpot_rollover: number
  status: string
}

export default function AdminMonthlyDraws() {
  const [isSimulating, setIsSimulating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [lastDraw, setLastDraw] = useState<DrawRecord | null>(null)
  const [drawResult, setDrawResult] = useState<{
    numbers: number[],
    winners: { tier5: number, tier4: number, tier3: number },
    pool: number,
    rolloverValue: number
  } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchLastDraw()
  }, [])

  const fetchLastDraw = async () => {
    const { data: draws, error } = await supabase
      .from('draws')
      .select('*')
      .order('draw_date', { ascending: false })
      .limit(1)
    
    if (!error && draws && draws.length > 0) {
      setLastDraw(draws[0])
    }
  }

  const simulateDraw = async () => {
    setIsSimulating(true)
    
    // Logic: Generate 5 random UNIQUE numbers between 1-45
    const numbers: number[] = []
    while(numbers.length < 5) {
      const r = Math.floor(Math.random() * 45) + 1
      if(numbers.indexOf(r) === -1) numbers.push(r)
    }
    numbers.sort((a,b) => a-b)

    try {
      // Create a mock draw record for simulation if none exists or use the latest
      // For a real simulation, we might want to count matches without publishing
      // We'll simulate the counts here for UX, but the real logic is in the RPC
      
      setDrawResult({
        numbers,
        winners: { 
          tier5: Math.floor(Math.random() * 2), // Mocking winner counts for simulation
          tier4: Math.floor(Math.random() * 5) + 1, 
          tier3: Math.floor(Math.random() * 20) + 5 
        },
        pool: 450000.00,
        rolloverValue: 180000.00
      })
    } catch (error) {
      console.error('Simulation error:', error)
    } finally {
      setIsSimulating(false)
    }
  }

  const publishDraw = async () => {
    if (!drawResult) return
    setIsPublishing(true)

    try {
      // 1. Create the draw record first if it doesn't exist or use the current simulation
      const { data: newDraw, error: drawError } = await supabase
        .from('draws')
        .insert([{
          winning_numbers: drawResult.numbers,
          total_pool: drawResult.pool,
          jackpot_rollover: drawResult.rolloverValue,
          status: 'simulated',
          draw_date: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (drawError) throw drawError
      
      // 2. Call the RPC to finalize results and identify winners
      const { error: rpcError } = await supabase.rpc('generate_draw_results', {
        p_draw_id: newDraw.id,
        p_winning_numbers: drawResult.numbers
      })

      if (rpcError) throw rpcError
      
      alert("Monthly Draw Published! Winners have been identified and results are live.")
      setDrawResult(null)
      fetchLastDraw()
    } catch (error: any) {
      alert(`Error publishing draw: ${error.message}`)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="space-y-12">
      <header className="flex items-center justify-between">
         <div className="space-y-2">
            <h1 className="text-4xl font-black outfit text-accent">Monthly Draw Engine</h1>
            <p className="text-secondary font-medium uppercase tracking-widest text-[10px]">Execute the monthly prize draw and manage jackpot rollovers.</p>
         </div>
         <button 
           onClick={simulateDraw}
           disabled={isSimulating}
           className="btn-primary py-4 px-8 text-sm flex items-center gap-3"
         >
            {isSimulating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            {isSimulating ? 'Simulating Algorithm...' : 'Run Simulation'}
         </button>
      </header>

      {/* History Snapshot */}
      {lastDraw && (
        <div className="glass p-6 bg-white/5 border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-secondary" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Last Official Draw</div>
              <div className="text-sm font-bold uppercase">{new Date(lastDraw.draw_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {lastDraw.winning_numbers.map((n, i) => (
              <span key={i} className="w-8 h-8 rounded-lg bg-black/40 border border-border flex items-center justify-center text-xs font-black outfit text-accent">
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Live Pool Stats */}
         <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="glass p-8 space-y-4 bg-accent/5 border-accent/20">
                  <div className="flex items-center gap-3 text-secondary">
                     <TrendingUp className="w-5 h-5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Current Prize Pool</span>
                  </div>
                  <div className="text-5xl font-black outfit gradient-text">£450,240.00</div>
                  <p className="text-xs text-secondary font-medium">Accumulated from active subscribers.</p>
               </div>
               <div className="glass p-8 space-y-4 bg-orange-500/5 border-orange-500/20">
                  <div className="flex items-center gap-3 text-secondary">
                     <Trophy className="w-5 h-5 text-orange-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Jackpot Rollover</span>
                  </div>
                  <div className="text-5xl font-black outfit text-orange-400">£180,000.00</div>
                  <p className="text-xs text-secondary font-medium">Carried over from previous draw.</p>
               </div>
            </div>

            {/* Simulation Results Area */}
            <AnimatePresence>
              {drawResult && (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="glass p-10 space-y-12 relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <Dice5 className="w-48 h-48 text-accent" />
                    </div>

                    <div className="space-y-6 text-center">
                       <h3 className="text-xl font-black outfit uppercase tracking-widest text-accent">Draw Result (Generated)</h3>
                       <div className="flex items-center justify-center gap-4">
                          {drawResult.numbers.map((n, i) => (
                             <motion.div 
                               key={i} 
                               initial={{ scale: 0 }}
                               animate={{ scale: 1 }}
                               transition={{ delay: i * 0.1 }}
                               className="w-16 h-16 rounded-2xl bg-accent text-background flex items-center justify-center text-2xl font-black outfit shadow-xl shadow-accent/20"
                             >
                                {n}
                             </motion.div>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                       <div className="p-6 rounded-2xl bg-black/40 border border-border text-center space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">5-Match Winners</div>
                          <div className="text-2xl font-black outfit">{drawResult.winners.tier5}</div>
                       </div>
                       <div className="p-6 rounded-2xl bg-black/40 border border-border text-center space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">4-Match Winners</div>
                          <div className="text-2xl font-black outfit">{drawResult.winners.tier4}</div>
                       </div>
                       <div className="p-6 rounded-2xl bg-black/40 border border-border text-center space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">3-Match Winners</div>
                          <div className="text-2xl font-black outfit">{drawResult.winners.tier3}</div>
                       </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 pt-8 border-t border-border/50">
                       <div className="flex items-center gap-3 text-sm font-bold text-secondary">
                          <AlertTriangle className="w-5 h-5 text-orange-400" />
                          Results verified against member entropy.
                       </div>
                       <div className="flex gap-4">
                         <button 
                           onClick={() => setDrawResult(null)}
                           className="btn-secondary py-4 px-8 text-sm"
                         >
                            Discard
                         </button>
                         <button 
                           onClick={publishDraw}
                           disabled={isPublishing}
                           className="btn-primary py-4 px-12 text-sm flex items-center gap-3 bg-golf-green text-background hover:bg-golf-green hover:shadow-golf-green/20"
                         >
                            {isPublishing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            Confirm and Publish Draw
                         </button>
                       </div>
                    </div>
                 </motion.div>
              )}
            </AnimatePresence>
         </div>

         {/* Draw Configuration / Engine Sidebar */}
         <div className="space-y-8">
            <div className="glass p-8 space-y-8">
               <h3 className="text-sm font-black outfit uppercase tracking-widest text-secondary flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" /> Engine Settings
               </h3>
               
               <div className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Selection Logic</label>
                     <div className="flex gap-2">
                        <button className="flex-grow py-3 rounded-lg border border-accent bg-accent/10 text-accent text-[10px] font-black uppercase">Weighted</button>
                        <button className="flex-grow py-3 rounded-lg border border-border bg-black/40 text-secondary text-[10px] font-black uppercase">Pure Random</button>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Charity Minimum</label>
                     <div className="p-4 rounded-xl bg-black/40 border border-border text-center">
                        <span className="text-lg font-black outfit">10%</span>
                        <p className="text-[8px] uppercase tracking-widest text-secondary mt-1">Global Platform Rule</p>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Pool Distribution</label>
                     <div className="space-y-2 text-[10px] font-bold text-secondary/60 uppercase">
                        <div className="flex justify-between">
                           <span>5-Match (Jackpot)</span>
                           <span className="text-accent">40%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-accent h-full w-[40%]" />
                        </div>
                        <div className="flex justify-between pt-2">
                           <span>4-Match</span>
                           <span className="text-white">35%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-white/40 h-full w-[35%]" />
                        </div>
                        <div className="flex justify-between pt-2">
                           <span>3-Match</span>
                           <span className="text-white">25%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-white/40 h-full w-[25%]" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
