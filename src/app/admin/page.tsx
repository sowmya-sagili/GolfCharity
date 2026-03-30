'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Mail, 
  Shield, 
  CreditCard, 
  Search, 
  MoreVertical,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle
} from 'lucide-react'

// Mock users for administration
const MOCK_USERS = [
  { id: 'u1', name: 'Alex Thompson', email: 'alex@example.com', role: 'user', status: 'active', sub: 'Monthly' },
  { id: 'u2', name: 'Sarah Miller', email: 'sarah@example.com', role: 'user', status: 'active', sub: 'Yearly' },
  { id: 'u3', name: 'James Wilson', email: 'james@example.com', role: 'admin', status: 'active', sub: 'Monthly' },
  { id: 'u4', name: 'Emily Davis', email: 'emily@example.com', role: 'user', status: 'inactive', sub: 'None' },
  { id: 'u5', name: 'Mark Evans', email: 'mark@example.com', role: 'user', status: 'active', sub: 'Monthly' },
]

export default function AdminUserManagement() {
  const [users, setUsers] = useState(MOCK_USERS)

  const toggleRole = (id: string) => {
    setUsers(users.map(u => 
      u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u
    ))
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div className="space-y-2">
            <h1 className="text-4xl font-black outfit text-accent">User Management</h1>
            <p className="text-secondary font-medium uppercase tracking-widest text-[10px]">Manage the global community, roles, and platform access.</p>
         </div>
         
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-72">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
               <input 
                  type="text" 
                  placeholder="Search by name, email..."
                  className="w-full bg-black/40 border border-border rounded-xl px-12 py-3 text-sm focus:border-accent outline-none font-medium"
               />
            </div>
            <button className="btn-secondary py-3 px-4 flex items-center gap-2">
               <Filter className="w-4 h-4" /> Filter
            </button>
         </div>
      </header>

      {/* User Table */}
      <div className="glass overflow-hidden border-border bg-card-bg/10">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b border-border bg-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60">Golfer</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60">Subscription</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60">Access Level</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60">Account Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/60 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
               {users.map((u) => (
                  <motion.tr 
                     key={u.id}
                     whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                     className="group transition-colors"
                  >
                     <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-black outfit text-accent text-sm">
                              {u.name.charAt(0)}
                           </div>
                           <span className="font-bold text-sm">{u.name}</span>
                        </div>
                     </td>
                     <td className="px-6 py-6 font-medium text-secondary text-sm">
                        <div className="flex items-center gap-2">
                           <Mail className="w-3.5 h-3.5 opacity-50" /> {u.email}
                        </div>
                     </td>
                     <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-xs font-bold">
                           <CreditCard className="w-3.5 h-3.5 text-secondary" /> {u.sub}
                        </div>
                     </td>
                     <td className="px-6 py-6">
                        <button 
                          onClick={() => toggleRole(u.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-background ${
                             u.role === 'admin' ? 'bg-accent' : 'bg-secondary/40 text-secondary'
                          }`}
                        >
                           <Shield className="w-3 h-3" /> {u.role}
                        </button>
                     </td>
                     <td className="px-6 py-6">
                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                           u.status === 'active' ? 'text-golf-green' : 'text-red-500'
                        }`}>
                           {u.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                           {u.status}
                        </div>
                     </td>
                     <td className="px-6 py-6 text-right">
                        <button className="p-2 rounded-lg hover:bg-border/60 transition-colors">
                           <MoreVertical className="w-4 h-4 text-secondary" />
                        </button>
                     </td>
                  </motion.tr>
               ))}
            </tbody>
         </table>
         
         <div className="px-6 py-4 border-t border-border flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-secondary/60">
            <span>Showing {users.length} Golfers</span>
            <div className="flex items-center gap-4">
               <button className="hover:text-accent disabled:opacity-30" disabled>Previous</button>
               <button className="hover:text-accent">Next Page</button>
            </div>
         </div>
      </div>
    </div>
  )
}
