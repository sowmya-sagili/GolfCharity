'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { User, LogOut, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh() // Ensure the UI updates across the app
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass m-4 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-2xl font-bold tracking-tight outfit gradient-text">
        GolfCharity
      </Link>
      
      <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
        <Link href="/how-it-works" className="hover:text-accent transition-colors">How it Works</Link>
        <Link href="/charities" className="hover:text-accent transition-colors">Charities</Link>
        <Link href="/monthly-draws" className="hover:text-accent transition-colors">Monthly Draws</Link>
      </nav>

      <div className="flex items-center space-x-4">
        {loading ? (
          <div className="h-8 w-20 bg-white/5 animate-pulse rounded-lg" />
        ) : user ? (
          <div className="flex items-center gap-6">
            <Link 
               href="/dashboard"
               className="flex items-center gap-2 text-sm font-bold hover:text-accent transition-colors"
            >
               <User className="w-4 h-4" />
               <span className="hidden sm:inline">{user.email}</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-bold text-secondary hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium hover:text-accent transition-colors">Login</Link>
            <Link href="/signup" className="btn-primary py-2 px-5 text-sm">Join Now</Link>
          </>
        )}
      </div>
    </header>
  )
}
