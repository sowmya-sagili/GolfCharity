'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Shield, 
  CreditCard, 
  Heart,
  Mail,
  Calendar,
  Loader2,
  Filter
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  is_admin: boolean
  subscription_status: string
  current_charity_id: string
  charity_percentage: number
  created_at?: string
  charities?: {
    name: string
  }
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    // Use the secure admin RPC that bypasses RLS recursion
    const { data, error } = await supabase.rpc('get_all_profiles_for_admin')
    
    if (error) {
      console.error('Error fetching users:', error.message)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.subscription_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-2">
        <h1 className="text-4xl font-black outfit text-accent">User Management</h1>
        <p className="text-secondary font-medium uppercase tracking-widest text-[10px]">Monitor registered golfers and subscription health.</p>
      </header>

      {/* Filters & Stats */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-grow lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
            <input 
              type="text" 
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-border rounded-xl px-12 py-3 text-sm focus:border-accent outline-none font-medium"
            />
          </div>
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/40 border border-border rounded-xl pl-12 pr-10 py-3 text-sm focus:border-accent outline-none appearance-none font-bold text-secondary cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lapsed">Lapsed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-8 px-8 py-3 rounded-2xl bg-white/5 border border-border/40">
           <div className="text-center">
              <div className="text-xl font-black outfit text-accent">{users.length}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-secondary">Total Users</div>
           </div>
           <div className="w-px h-8 bg-border/40" />
           <div className="text-center">
              <div className="text-xl font-black outfit text-golf-green">
                {users.filter(u => u.subscription_status === 'active').length}
              </div>
              <div className="text-[8px] font-black uppercase tracking-widest text-secondary">Active Subs</div>
           </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass overflow-hidden border-border/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Golfer</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Role</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Subscription</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Charity Focus</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-sm font-bold truncate max-w-[200px]">{u.email}</div>
                          <div className="text-[8px] font-black uppercase tracking-widest text-secondary/60">ID: {u.id.slice(0,8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        u.is_admin ? 'bg-purple-500/10 text-purple-400' : 'bg-secondary/10 text-secondary'
                      }`}>
                        <Shield className="w-3 h-3" /> {u.is_admin ? 'Admin' : 'User'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`flex items-center gap-2 text-xs font-bold ${
                        u.subscription_status === 'active' ? 'text-golf-green' : 'text-secondary/40'
                      }`}>
                        <CreditCard className="w-4 h-4" />
                        <span className="capitalize">{u.subscription_status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-xs font-bold flex items-center gap-2">
                          <Heart className="w-3 h-3 text-red-500" />
                          {u.charities?.name || 'Not Selected'}
                        </div>
                        <div className="text-[10px] font-black text-secondary/60 uppercase">{u.charity_percentage}% Contribution</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <div className="text-xs font-bold">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</div>
                        <div className="text-[10px] uppercase font-black text-secondary/40 tracking-tighter">Registered Date</div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-secondary font-bold uppercase tracking-widest text-xs">
                    No golfers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
