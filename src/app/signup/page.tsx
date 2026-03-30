'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Heart, ChevronRight, AlertCircle } from 'lucide-react'

const MOCK_CHARITIES = [
  { id: '1', name: 'Golf for Good' },
  { id: '2', name: 'Elite Par Foundation' },
  { id: '3', name: 'Caddyshack Kids' },
  { id: '4', name: 'Green Fairways Charity' }
]

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [charityId, setCharityId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!charityId) {
      setError('Please select a charity to support.')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            current_charity_id: charityId,
            role: 'user'
          }
        }
      })

      if (error) throw error
      router.push('/subscribe') // Redirect to subscription after signup
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-12 w-full max-w-2xl space-y-12 bg-card-bg/60 backdrop-blur-2xl"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black outfit gradient-text">Start Your Impact</h1>
          <p className="text-secondary font-medium px-4">Create your account and choose a charity to support with every round.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1: Personal Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black/40 border border-border rounded-xl px-12 py-4 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-black/40 border border-border rounded-xl px-12 py-4 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-border rounded-xl px-12 py-4 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Column 2: Charity & Submit */}
          <div className="space-y-6 border-l border-border md:pl-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest pl-1">Choose Your Charity</label>
              <div className="relative">
                <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <select 
                  value={charityId}
                  onChange={(e) => setCharityId(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-12 py-4 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled className="bg-background">Select a partner...</option>
                  {MOCK_CHARITIES.map(c => (
                    <option key={c.id} value={c.id} className="bg-background">{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                   <ChevronRight className="w-4 h-4 text-secondary rotate-90" />
                </div>
              </div>
              <p className="text-[10px] text-secondary/50 font-bold uppercase tracking-widest pl-1 mt-2">
                10% of every subscription month goes directly to your choice.
              </p>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Continue to Checkout'}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="text-center text-sm font-medium text-secondary pt-4">
              Already a member? {' '}
              <Link href="/login" className="text-accent hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </form>
      </motion.div>

      <div className="mt-12 text-center max-w-lg">
          <p className="text-xs text-secondary/50 font-medium">
            By signing up, you agree to our Terms of Service and Prize Draw Rules. Subscriptions are billed monthly or annually and can be cancelled anytime.
          </p>
      </div>
    </div>
  )
}
