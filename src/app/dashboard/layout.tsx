'use client'

import { motion } from 'framer-motion'
import { 
  BarChart3, 
  History, 
  Heart, 
  Settings, 
  PlusCircle, 
  Trophy, 
  Wallet,
  LogOut,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: BarChart3 },
    { name: 'My Scores', href: '/dashboard/scores', icon: History },
    { name: 'Charity Impact', href: '/dashboard/charity', icon: Heart },
    { name: 'Winnings', href: '/dashboard/winnings', icon: Wallet },
    { name: 'Account Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Sidebar Navigation */}
      <aside className="w-72 glass m-4 mr-0 p-6 flex flex-col space-y-10 border-r-0 border-border bg-card-bg/20">
        <div className="flex items-center gap-3 pl-2">
          <Link href="/" className="text-2xl font-black outfit gradient-text">GolfCharity</Link>
        </div>

        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-bold transition-all group ${
                pathname === item.href 
                  ? 'bg-accent/10 border border-accent/20 text-accent' 
                  : 'text-secondary hover:text-foreground hover:bg-border/40'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
              {pathname === item.href && (
                <motion.div 
                  layoutId="active-nav"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-accent"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="space-y-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-4 w-full rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Log Out
          </button>

          {/* User Status Card */}
          <div className="p-4 rounded-xl border border-border/50 bg-black/20 space-y-3">
             <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-secondary/60">
                <span>Status</span>
                <span className="text-golf-green">Active Member</span>
             </div>
             <div className="h-1.5 bg-border/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-accent" 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                />
             </div>
             <p className="text-[10px] font-bold text-secondary text-center">Renewal in 12 days</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 overflow-y-auto">
         <div className="glass h-full bg-card-bg/10 backdrop-blur-3xl overflow-y-auto custom-scrollbar rounded-2xl border-border/50 p-8">
            {children}
         </div>
      </main>
    </div>
  )
}
