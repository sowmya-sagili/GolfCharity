'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Image as ImageIcon,
  TrendingUp,
  Search,
  ExternalLink,
  ShieldAlert
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Charity {
  id: string
  name: string
  description: string
  image_url: string
  total_raised: number
  created_at: string
}

export default function AdminCharityManagement() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCharity, setEditingCharity] = useState<Charity | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    total_raised: 0
  })

  const supabase = createClient()

  useEffect(() => {
    fetchCharities()
  }, [])

  const fetchCharities = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching charities:', error?.message || error)
    } else {
      setCharities(data || [])
    }
    setLoading(false)
  }

  const handleOpenModal = (charity: Charity | null = null) => {
    if (charity) {
      setEditingCharity(charity)
      setFormData({
        name: charity.name,
        description: charity.description || '',
        image_url: charity.image_url || '',
        total_raised: charity.total_raised || 0
      })
    } else {
      setEditingCharity(null)
      setFormData({
        name: '',
        description: '',
        image_url: '',
        total_raised: 0
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingCharity) {
        const { error } = await supabase
          .from('charities')
          .update(formData)
          .eq('id', editingCharity.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('charities')
          .insert([formData])
        
        if (error) throw error
      }
      
      setIsModalOpen(false)
      fetchCharities()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this charity partner?')) return

    try {
      const { error } = await supabase
        .from('charities')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchCharities()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div className="space-y-2">
            <h1 className="text-4xl font-black outfit text-accent">Charity Management</h1>
            <p className="text-secondary font-medium uppercase tracking-widest text-[10px]">Onboard and manage global charity partners.</p>
         </div>
         
         <button 
           onClick={() => handleOpenModal()}
           className="btn-primary py-3 px-6 flex items-center gap-2 font-black outfit"
         >
            <Plus className="w-5 h-5" /> Add Partner
         </button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="glass p-6 bg-card-bg/20 border-border/40">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                  <Heart className="w-6 h-6 text-accent" />
               </div>
               <div>
                  <div className="text-2xl font-black outfit">{charities.length}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Total Partners</div>
               </div>
            </div>
         </div>
         <div className="glass p-6 bg-card-bg/20 border-border/40">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-golf-green/10 flex items-center justify-center border border-golf-green/20">
                  <TrendingUp className="w-6 h-6 text-golf-green" />
               </div>
               <div>
                  <div className="text-2xl font-black outfit">
                    £{charities.reduce((acc, curr) => acc + (curr.total_raised || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Total Impact</div>
               </div>
            </div>
         </div>
         <div className="glass p-6 bg-card-bg/20 border-border/40">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <ExternalLink className="w-6 h-6 text-blue-400" />
               </div>
               <div>
                  <div className="text-2xl font-black outfit">98%</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Delivery Rate</div>
               </div>
            </div>
         </div>
      </div>

      {/* Charities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass h-64 animate-pulse bg-white/5 border-border/20" />
            ))
          ) : charities.length > 0 ? (
            charities.map((charity) => (
              <motion.div 
                key={charity.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass p-8 flex flex-col justify-between space-y-8 hover:border-accent/40 transition-all group border-border bg-card-bg/10"
              >
                 <div className="space-y-6">
                    <div className="flex items-start justify-between">
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
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(charity)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-accent hover:text-background transition-all"
                          >
                             <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(charity.id)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white transition-all"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <h3 className="text-2xl font-black outfit group-hover:text-accent transition-colors">
                          {charity.name}
                       </h3>
                       <p className="text-secondary text-sm font-medium leading-relaxed line-clamp-3">
                          {charity.description}
                       </p>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-border mt-auto flex items-end justify-between font-black outfit">
                    <div className="space-y-1">
                       <div className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Total Raised</div>
                       <div className="text-xl gradient-text">
                          £{Number(charity.total_raised || 0).toLocaleString()}
                       </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-secondary/40">
                      ID: {charity.id.slice(0, 8)}...
                    </div>
                 </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass border-dashed bg-white/5">
               <ShieldAlert className="w-12 h-12 text-secondary/20 mx-auto mb-4" />
               <p className="text-secondary font-bold uppercase tracking-widest text-xs">No charities found. Add your first partner above.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-8 backdrop-blur-xl">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative max-w-xl w-full glass p-10 space-y-10 border-accent/40 bg-card-bg/40 shadow-2xl"
            >
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/5 transition-colors"
               >
                 <X className="w-6 h-6 text-secondary" />
               </button>

               <div className="space-y-2">
                  <h2 className="text-3xl font-black outfit">
                    {editingCharity ? 'Edit Partner' : 'New Charity Partner'}
                  </h2>
                  <p className="text-secondary text-sm font-medium">Configure partnership details and branding.</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Charity Name</label>
                     <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Save The Children"
                        className="w-full bg-black/40 border border-border rounded-xl px-6 py-4 focus:border-accent outline-none font-bold"
                        required
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Description / Mission</label>
                     <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the charity's impact..."
                        rows={4}
                        className="w-full bg-black/40 border border-border rounded-xl px-6 py-4 focus:border-accent outline-none font-medium resize-none"
                        required
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Logo URL</label>
                       <div className="relative">
                          <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40" />
                          <input 
                             type="url" 
                             value={formData.image_url}
                             onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                             placeholder="https://..."
                             className="w-full bg-black/40 border border-border rounded-xl pl-16 pr-6 py-4 focus:border-accent outline-none font-medium"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Total Impact (£)</label>
                       <div className="relative">
                          <TrendingUp className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40" />
                          <input 
                             type="number" 
                             step="0.01"
                             value={formData.total_raised}
                             onChange={(e) => setFormData({ ...formData, total_raised: parseFloat(e.target.value) || 0 })}
                             className="w-full bg-black/40 border border-border rounded-xl pl-16 pr-6 py-4 focus:border-accent outline-none font-medium"
                             required
                          />
                       </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                     <button 
                       type="button"
                       onClick={() => setIsModalOpen(false)}
                       className="btn-secondary flex-1 py-4 font-black outfit"
                     >
                        Cancel
                     </button>
                     <button 
                       type="submit" 
                       disabled={loading}
                       className="btn-primary flex-1 py-4 font-black outfit flex items-center justify-center gap-2"
                     >
                        {loading ? <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                        {editingCharity ? 'Update' : 'Register'} Partner
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
