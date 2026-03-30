'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  User, 
  Mail, 
  Shield, 
  CreditCard, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Profile {
  id: string
  role: string
  subscription_status: string
  charity_percentage: number
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // 1. Get Auth User for email
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      setUser(authUser)

      // 2. Fetch Profile using the requested pattern
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      if (error) throw error
      setProfile(profileData)
    } catch (error: any) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage(null)

    try {
      // Logic for updating profile (e.g. metadata or other fields if we had them)
      // For now, we'll just simulate success as the schema is focused on charity/scores
      await new Promise(resolve => setTimeout(resolve, 800))
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  const fadeIn = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4 }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="space-y-2">
        <h1 className="text-4xl font-black outfit gradient-text">Account Settings</h1>
        <p className="text-secondary font-medium uppercase tracking-widest text-[10px]">Manage your profile and subscription preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation / Tabs (Visual only for now) */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold text-sm">
            <User className="w-5 h-5" /> Profile Info
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-xl hover:bg-white/5 text-secondary font-bold text-sm transition-all">
            <CreditCard className="w-5 h-5" /> Subscription
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-xl hover:bg-white/5 text-secondary font-bold text-sm transition-all">
            <Shield className="w-5 h-5" /> Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-8">
          <motion.div {...fadeIn} className="glass p-10 space-y-8">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-secondary" />
              <h2 className="text-2xl font-black outfit">General Information</h2>
            </div>

            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                message.type === 'success' ? 'bg-golf-green/10 text-golf-green' : 'bg-red-500/10 text-red-500'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Email Address (Read-only)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40" />
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    readOnly 
                    className="w-full bg-white/5 border border-border/50 rounded-xl px-12 py-4 text-secondary cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Account Role</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40" />
                    <input 
                      type="text" 
                      value={profile?.role || 'User'} 
                      readOnly 
                      className="w-full bg-white/5 border border-border/50 rounded-xl px-12 py-4 text-secondary cursor-not-allowed outline-none capitalize"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary pl-1">Subscription Status</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40" />
                    <input 
                      type="text" 
                      value={profile?.subscription_status || 'Inactive'} 
                      readOnly 
                      className="w-full bg-white/5 border border-border/50 rounded-xl px-12 py-4 text-secondary cursor-not-allowed outline-none capitalize"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={updating}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-3 font-black outfit uppercase tracking-widest disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>

          {/* Dangerous Zone */}
          <div className="p-8 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-4">
            <h3 className="text-sm font-black outfit text-red-500 uppercase tracking-widest">Dangerous Area</h3>
            <p className="text-secondary text-xs font-medium">Once you delete your account, there is no going back. Please be certain.</p>
            <button className="text-xs font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors">
              Delete Account & Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
