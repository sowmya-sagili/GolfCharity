'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, 
  TrendingUp, 
  Award,
  ChevronRight,
  Settings,
  PiggyBank,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Charity {
  id: string
  name: string
  description: string
  total_raised: number
}

interface Profile {
  id: string
  current_charity_id: string
  charity_percentage: number
}

export default function CharityImpact() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null)
  const [perc, setPerc] = useState(10)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Fetch Charities
      const { data: charitiesData } = await supabase
        .from('charities')
        .select('*')
      
      setCharities(charitiesData || [])

      // 2. Fetch Profile using the requested pattern
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
        setPerc(profileData.charity_percentage || 10)
        
        if (profileData.current_charity_id) {
          const matched = charitiesData?.find(c => c.id === profileData.current_charity_id)
          if (matched) setSelectedCharity(matched)
        } else if (charitiesData && charitiesData.length > 0) {
          setSelectedCharity(charitiesData[0])
        }
      }
    } catch (error) {
      console.error('Error fetching charity data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!profile || !selectedCharity) return
    
    setUpdating(true)
    setMessage(null)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          current_charity_id: selectedCharity.id,
          charity_percentage: perc
        })
        .eq('id', profile.id)

      if (error) throw error
      
      setMessage("Charity settings updated successfully!")
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Error updating charity settings:', error)
      alert(error.message)
    } finally {
      setUpdating(false)
    }
  }

  const fadeIn = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black outfit gradient-text">Charity Impact</h1>
          <p className="text-secondary font-medium uppercase tracking-widest text-xs font-bold">Your game, their future.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Impact Card */}
        <div className="lg:col-span-2 space-y-8">
           <motion.div 
             {...fadeIn}
             className="glass p-10 relative overflow-hidden bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20"
           >
              <div className="absolute top-0 right-0 p-12 opacity-10">
                 <Heart className="w-64 h-64 text-red-500" />
              </div>

              <div className="relative z-10 space-y-8">
                 <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-[10px] font-black tracking-widest uppercase">
                       Currently Supporting
                    </div>
                    <h2 className="text-4xl font-black outfit">{selectedCharity?.name || 'No Charity Selected'}</h2>
                    <p className="text-secondary font-medium text-lg max-w-xl">
                      {selectedCharity?.description || 'Select a charity from the settings to start contributing.'}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-4">
                    <div className="space-y-1">
                       <div className="text-3xl font-black outfit">£{(selectedCharity?.total_raised ? (selectedCharity.total_raised / 100) : 0).toFixed(2)}</div>
                       <div className="text-[10px] font-black uppercase tracking-widest text-secondary">Your Contribution</div>
                    </div>
                    <div className="space-y-1 border-l border-border pl-8">
                       <div className="text-3xl font-black outfit">{perc}%</div>
                       <div className="text-[10px] font-black uppercase tracking-widest text-secondary">Of Subscription</div>
                    </div>
                    <div className="space-y-1 border-l border-border pl-8 hidden sm:block">
                       <div className="text-3xl font-black outfit">{(selectedCharity?.total_raised || 0).toLocaleString()}</div>
                       <div className="text-[10px] font-black uppercase tracking-widest text-secondary">Total Raised Globally</div>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button className="btn-primary py-3 px-6 text-xs tracking-widest uppercase">View Partner Details</button>
                    <button className="btn-secondary py-3 px-6 text-xs tracking-widest uppercase">Visit Website</button>
                 </div>
              </div>
           </motion.div>

           {/* Donation History / Impact Timeline */}
           <div className="glass p-8 space-y-8">
              <h3 className="text-xl font-black outfit flex items-center gap-3">
                 <TrendingUp className="w-5 h-5 text-accent" /> Contribution History
              </h3>
              
              <div className="space-y-4">
                 {[1, 2, 3].map((month) => (
                    <div key={month} className="flex items-center justify-between p-4 rounded-xl border border-border bg-black/20 hover:bg-border/20 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-accent/5 flex items-center justify-center">
                             <Award className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                             <p className="font-bold text-sm">Monthly Subscription Donation</p>
                             <p className="text-[10px] uppercase tracking-widest text-secondary/60">March {2026 - month}</p>
                          </div>
                       </div>
                       <div className="text-lg font-black outfit">£{(perc / 10).toFixed(2)}</div>
                    </div>
                 ))}
              </div>
              
              <button className="text-sm font-bold text-secondary hover:text-accent flex items-center gap-2 transition-all">
                 Download Full Tax Receipt <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Sidebar Settings Area */}
        <div className="space-y-8">
           <motion.div 
             {...fadeIn}
             transition={{ delay: 0.2 }}
             className="glass p-8 space-y-8"
           >
              <div className="flex items-center gap-3">
                 <Settings className="w-5 h-5 text-secondary" />
                 <h3 className="font-black outfit text-sm uppercase tracking-widest">Settings</h3>
              </div>

              {message && (
                <div className="p-3 bg-golf-green/10 text-golf-green rounded-lg text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {message}
                </div>
              )}

              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Change Charity</label>
                    <select 
                       className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none appearance-none"
                       value={selectedCharity?.id || ''}
                       onChange={(e) => {
                          const found = charities.find(c => c.id === e.target.value)
                          if (found) setSelectedCharity(found)
                       }}
                    >
                       <option value="" disabled>Select a charity</option>
                       {charities.map(c => (
                          <option key={c.id} value={c.id} className="bg-background">{c.name}</option>
                       ))}
                    </select>
                 </div>

                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Donation %</label>
                       <span className="text-xs font-black outfit text-accent">{perc}%</span>
                    </div>
                    <input 
                       type="range" 
                       min="10" 
                       max="50" 
                       value={perc}
                       onChange={(e) => setPerc(parseInt(e.target.value))}
                       className="w-full accent-accent h-1.5 bg-border rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-secondary/40">
                       <span>Min 10%</span>
                       <span>Max 50%</span>
                    </div>
                 </div>

                 <button 
                   onClick={handleUpdate}
                   disabled={updating}
                   className="btn-primary w-full py-3 text-xs tracking-widest uppercase disabled:opacity-50"
                 >
                    {updating ? 'Updating...' : 'Save Settings'}
                 </button>
              </div>
           </motion.div>

           <div className="glass p-8 bg-black/40 space-y-4 text-center">
              <div className="flex items-center justify-center gap-3 text-golf-green">
                 <PiggyBank className="w-6 h-6" />
                 <h3 className="text-sm font-black outfit uppercase tracking-widest">Sustainability Note</h3>
              </div>
              <p className="text-[11px] font-medium text-secondary">
                 Your higher contribution percentage (<span className="text-white">{perc}%</span>) directly impact the amount of funding available for the charity's upcoming infrastructure projects. Thank you for your generosity.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
