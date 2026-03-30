'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  CheckCircle, 
  Settings, 
  PlayCircle, 
  Trophy, 
  FileText,
  LogOut,
  ChevronRight,
  ShieldAlert
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const adminNav = [
    { name: 'User Management', href: '/admin', icon: Users },
    { name: 'Score Verification', href: '/admin/scores', icon: CheckCircle },
    { name: 'Monthly Draws', href: '/admin/draws', icon: PlayCircle },
    { name: 'Winner Payouts', href: '/admin/winners', icon: Trophy },
    { name: 'Charity Management', href: '/admin/charities', icon: ShieldAlert },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <aside className="w-72 glass m-4 mr-0 p-6 flex flex-col space-y-10 border-r-0 border-border bg-black/40">
        <div className="flex items-center gap-3 pl-2">
           <Link href="/" className="text-2xl font-black outfit text-accent tracking-tighter">GolfAdmin</Link>
        </div>

        <nav className="flex-grow space-y-2">
          {adminNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-bold transition-all group ${
                pathname === item.href 
                  ? 'bg-accent text-background' 
                  : 'text-secondary hover:text-foreground hover:bg-border/40'
              }`}
            >
              <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-background' : 'text-secondary group-hover:text-accent'}`} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="space-y-4">
           <button 
             onClick={handleLogout}
             className="flex items-center gap-4 px-4 py-4 w-full rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all group"
           >
             <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
             Exit Admin
           </button>
        </div>
      </aside>

      <main className="flex-grow p-4 overflow-y-auto">
         <div className="glass h-full bg-card-bg/10 backdrop-blur-3xl overflow-y-auto custom-scrollbar rounded-2xl border-border/50 p-8">
            <div className="max-w-7xl mx-auto">
               {children}
            </div>
         </div>
      </main>
    </div>
  )
}
