'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // DEBUG: Log credentials safely in the browser console
    console.log('[Login Attempt]', { email })

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        console.error('[Login Error]', authError)
        throw authError
      }

      console.log('[Login Success]', data.user?.id)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? 'Invalid email or password. Please check your credentials.' 
        : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-12 w-full max-w-md space-y-8 bg-card-bg/60 backdrop-blur-2xl"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black outfit gradient-text">Welcome Back</h1>
          <p className="text-secondary font-medium">Log in to manage your scores and winnings.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-black/40 border border-border rounded-xl px-12 py-4 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-secondary/50"
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
                className="w-full bg-black/40 border border-border rounded-xl px-12 py-4 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-secondary/50"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-4 text-lg mt-4 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm font-medium text-secondary">
          Don't have an account? {' '}
          <Link href="/signup" className="text-accent hover:underline">
            Join the community
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
