import { createClient } from '@/lib/supabase-server'
import { Trophy, Calendar, Target, DollarSign, History } from 'lucide-react'

export const revalidate = 60 // Revalidate every minute

export default async function MonthlyDraws() {
  const supabase = await createClient()
  const { data: draws, error } = await supabase
    .from('draws')
    .select('*')
    .order('draw_date', { ascending: false })

  if (error) {
    console.error('Error fetching draws:', error)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 space-y-24">
      {/* Header */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black outfit">
          Monthly <span className="gradient-text">Draws</span>
        </h1>
        <p className="text-secondary text-lg font-medium leading-relaxed">
          The heart of GolfCharity. Every month, we distribute prize pools to thousands of winners.
          Participate automatically by maintaining your rolling 5 scores and active membership.
        </p>
      </div>

      {/* Live Pool / Next Draw Intro Card */}
      <div className="glass p-12 bg-accent/5 border-accent/20 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-5 transform translate-x-12 -translate-y-12">
            <Trophy className="w-80 h-80 text-accent" />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            <div className="space-y-6">
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-background text-[10px] font-black tracking-widest uppercase">
                  Upcoming Draw
               </div>
               <h2 className="text-4xl font-black outfit tracking-tight">April 1st, 2026</h2>
               <p className="text-secondary font-medium">
                  Ensure all scores are entered and verified 24 hours before the draw time.
                  Winning numbers will be published immediately after simulation.
               </p>
               <div className="flex gap-4">
                  <div className="p-4 rounded-xl border border-border bg-black/40">
                     <p className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Estimated Pool</p>
                     <p className="text-2xl font-black outfit">£480,000.00</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-black/40">
                     <p className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Jackpot Rollover</p>
                     <p className="text-2xl font-black outfit text-accent">£180,000.00</p>
                  </div>
               </div>
            </div>

            <div className="glass p-8 bg-black/60 space-y-6 border-border flex flex-col justify-center">
               <div className="space-y-1">
                  <h3 className="text-sm font-black outfit uppercase tracking-widest text-secondary">Draw Eligibility</h3>
                  <p className="text-xs text-secondary/60 font-medium">Status: Participant Confirmed</p>
               </div>
               <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-full animate-pulse" />
               </div>
               <div className="flex items-center gap-4 text-xs font-bold text-accent">
                  <History className="w-4 h-4" /> 5 Active Scores Detected
               </div>
            </div>
         </div>
      </div>

      {/* Historical Draws */}
      <div className="space-y-12">
         <div className="flex items-end justify-between px-4">
            <h2 className="text-3xl font-black outfit">Previous Draws</h2>
            <div className="text-[10px] uppercase font-bold text-secondary tracking-widest">Year: 2026</div>
         </div>

         <div className="grid grid-cols-1 gap-8">
            {draws && draws.length > 0 ? (
               draws.map((draw) => (
                  <div key={draw.id} className="glass p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 hover:border-accent/40 transition-all group">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 text-secondary/60">
                           <Calendar className="w-5 h-5" />
                           <span className="text-[10px] font-black uppercase tracking-widest">{new Date(draw.draw_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: 'numeric' })}</span>
                        </div>
                        <h3 className="text-2xl font-black outfit tracking-tight">Monthly Competition #{draw.id.slice(0, 4)}</h3>
                        <div className="flex items-center gap-3">
                           <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                              draw.status === 'published' ? 'bg-golf-green/20 text-golf-green' : 'bg-orange-500/20 text-orange-500'
                           }`}>
                              {draw.status}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4 text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Winning Numbers</div>
                        <div className="flex items-center gap-3 justify-center">
                           {(draw.winning_numbers as number[] || []).map((n, i) => (
                              <div key={i} className="w-12 h-12 rounded-full bg-accent text-background flex items-center justify-center font-black outfit text-lg shadow-xl shadow-accent/20 group-hover:scale-110 transition-transform">
                                 {n}
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-8 border-t lg:border-t-0 lg:border-l border-border/50 pt-8 lg:pt-0 lg:pl-12">
                        <div className="space-y-1">
                           <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Prize Pool</div>
                           <div className="text-xl font-black outfit">£{Number(draw.total_pool).toLocaleString()}</div>
                        </div>
                        <div className="space-y-1">
                           <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Rollover</div>
                           <div className={`text-xl font-black outfit ${Number(draw.jackpot_rollover) > 0 ? 'text-accent' : 'text-secondary'}`}>
                              £{Number(draw.jackpot_rollover).toLocaleString()}
                           </div>
                        </div>
                     </div>
                  </div>
               ))
            ) : (
               <div className="glass p-20 text-center space-y-6">
                  <Target className="w-16 h-16 text-secondary/20 mx-auto" />
                  <div className="space-y-2">
                     <p className="text-secondary font-black uppercase tracking-widest">No previous draw data found</p>
                     <p className="text-xs text-secondary/60 font-medium">Historical records will appear here as draws occur.</p>
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Detailed Rules CTA */}
      <div className="max-w-4xl mx-auto glass p-10 bg-black/40 border-border text-center space-y-6">
         <div className="flex items-center justify-center gap-4 text-accent">
            <DollarSign className="w-8 h-8" />
            <h2 className="text-2xl font-black outfit tracking-tight">Prize Distribution Policy</h2>
         </div>
         <p className="text-secondary font-medium leading-relaxed max-w-2xl mx-auto">
            Transparency is our pillar. All prize distributions are verified by independent auditors. 
            Winners are automatically notified and listed on their private dashboards.
         </p>
         <button className="btn-secondary py-3 px-8 text-xs font-black uppercase tracking-widest">
            Read Full Draw Rules
         </button>
      </div>
    </div>
  )
}
