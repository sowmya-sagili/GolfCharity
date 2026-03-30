import { createClient } from '@/lib/supabase-server'
import { motion } from 'framer-motion'
import { Heart, Coins, Users, ExternalLink } from 'lucide-react'

export const revalidate = 60 // Revalidate every minute

export default async function Charities() {
  const supabase = await createClient()
  const { data: charities, error } = await supabase
    .from('charities')
    .select('*')
    .order('total_raised', { ascending: false })

  if (error) {
    console.error('Error fetching charities:', error)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 space-y-24">
      {/* Header */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black outfit">
          Our <span className="gradient-text">Charity</span> Partners
        </h1>
        <p className="text-secondary text-lg font-medium">
          Meet the organizations making a global impact. Choose a partner during signup to support your cause with every monthly subscription.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center glass p-10 bg-accent/5 overflow-hidden border-accent/20">
        <div className="space-y-2">
           <Heart className="w-8 h-8 text-red-500 mx-auto" />
           <div className="text-3xl font-black outfit">15+</div>
           <div className="text-[10px] font-black uppercase tracking-widest text-secondary">Active Partners</div>
        </div>
        <div className="space-y-2 border-x border-border/50">
           <Coins className="w-8 h-8 text-accent mx-auto" />
           <div className="text-3xl font-black outfit">£1.2M+</div>
           <div className="text-[10px] font-black uppercase tracking-widest text-secondary">Total Raised</div>
        </div>
        <div className="space-y-2">
           <Users className="w-8 h-8 text-blue-400 mx-auto" />
           <div className="text-3xl font-black outfit">50k+</div>
           <div className="text-[10px] font-black uppercase tracking-widest text-secondary">Impacted Lives</div>
        </div>
      </div>

      {/* Charities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {charities && charities.length > 0 ? (
          charities.map((charity) => (
            <div 
              key={charity.id}
              className="glass p-10 flex flex-col justify-between space-y-8 hover:border-accent/40 transition-all group relative overflow-hidden"
            >
               {/* Impact Badge */}
               <div className="absolute top-0 right-0 bg-accent text-background text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rotate-45 translate-x-4 translate-y-2">
                  Top Partner
               </div>

               <div className="space-y-6">
                  {charity.image_url ? (
                    <img 
                      src={charity.image_url} 
                      alt={charity.name} 
                      className="w-16 h-16 rounded-2xl object-cover bg-accent/10 border border-accent/20"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
                       <Heart className="w-8 h-8 text-accent" />
                    </div>
                  )}

                  <div className="space-y-2">
                     <h3 className="text-2xl font-black outfit group-hover:text-accent transition-colors">
                        {charity.name}
                     </h3>
                     <p className="text-secondary text-sm font-medium leading-relaxed">
                        {charity.description}
                     </p>
                  </div>
               </div>

               <div className="pt-8 border-t border-border mt-auto flex items-end justify-between">
                  <div className="space-y-1">
                     <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Total Raised</div>
                     <div className="text-xl font-black outfit gradient-text">
                        £{Number(charity.total_raised).toLocaleString()}
                     </div>
                  </div>
                  <button className="p-3 rounded-xl bg-border/40 hover:bg-border transition-all">
                     <ExternalLink className="w-4 h-4 text-secondary" />
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass border-dashed">
             <Heart className="w-12 h-12 text-secondary/20 mx-auto mb-4" />
             <p className="text-secondary font-bold uppercase tracking-widest text-xs">No charities found</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-2xl mx-auto text-center glass p-8 border-accent/20">
         <p className="text-[11px] font-black uppercase tracking-widest text-secondary/80">
            Transparency Note: Every £1.00 of your contribution through GolfCharity reaches your selected cause directly.
            Administration costs are covered by the membership pool.
         </p>
      </div>
    </div>
  )
}
