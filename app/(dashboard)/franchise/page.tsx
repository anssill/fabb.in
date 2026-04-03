'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Network, MapPin, TrendingUp, TrendingDown, ArrowUpRight, IndianRupee, Users, Box, ArrowRightLeft, Shield, Eye, MoreVertical } from 'lucide-react'

import { useFranchiseStats, useBusinesses, useBranches } from '@/lib/queries/franchise'
import { Skeleton } from '@/components/ui/skeleton'

const FRANCHISE_KPIS_MOCK = [
  { label: 'Total Branches', value: '4', icon: <Network className="w-5 h-5 text-zinc-500" />, sub: 'All active' },
  { label: 'Network Revenue', value: '₹28,60,000', icon: <IndianRupee className="w-5 h-5 text-zinc-500" />, sub: 'This month' },
  { label: 'Total Staff', value: '24', icon: <Users className="w-5 h-5 text-zinc-500" />, sub: 'Across all branches' },
  { label: 'Pending Approvals', value: '3', icon: <Shield className="w-5 h-5 text-zinc-500" />, sub: '2 staff, 1 business' },
]

const BRANCHES = [
  {
    id: 'br-001',
    name: 'Echo Flagship Kolkata',
    location: 'Park Street, Kolkata',
    manager: 'Rahul K.',
    status: 'active' as const,
    revenue: '₹8,42,000',
    revenueChange: '+22%',
    trend: 'up' as const,
    items: 320,
    activeBookings: 42,
    nps: 87,
    royalty: '₹84,200',
    royaltyPct: 10,
  },
  {
    id: 'br-002',
    name: 'Echo South Kolkata',
    location: 'Gariahat, Kolkata',
    manager: 'Sneha P.',
    status: 'active' as const,
    revenue: '₹7,18,000',
    revenueChange: '+15%',
    trend: 'up' as const,
    items: 240,
    activeBookings: 36,
    nps: 82,
    royalty: '₹71,800',
    royaltyPct: 10,
  },
  {
    id: 'br-003',
    name: 'Echo Delhi NCR',
    location: 'Connaught Place, Delhi',
    manager: 'Amit S.',
    status: 'active' as const,
    revenue: '₹9,50,000',
    revenueChange: '+28%',
    trend: 'up' as const,
    items: 410,
    activeBookings: 58,
    nps: 91,
    royalty: '₹95,000',
    royaltyPct: 10,
  },
  {
    id: 'br-004',
    name: 'Echo Mumbai',
    location: 'Bandra West, Mumbai',
    manager: 'Priya D.',
    status: 'active' as const,
    revenue: '₹3,50,000',
    revenueChange: '-4%',
    trend: 'down' as const,
    items: 180,
    activeBookings: 14,
    nps: 72,
    royalty: '₹35,000',
    royaltyPct: 10,
  },
]

const TRANSFERS = [
  { id: 'TRF-001', item: 'Sabyasachi Lehenga (SAB-LEH-001)', from: 'Flagship Kolkata', to: 'Delhi NCR', status: 'in_transit', date: '28 Mar' },
  { id: 'TRF-002', item: 'Velvet Sherwani (VEL-SHR-044)', from: 'Delhi NCR', to: 'South Kolkata', status: 'delivered', date: '25 Mar' },
  { id: 'TRF-003', item: 'Banarasi Dupatta (BAN-DUP-010)', from: 'Mumbai', to: 'Flagship Kolkata', status: 'pending', date: '30 Mar' },
]

export default function FranchisePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transfers' | 'royalty'>('overview')
  const { data: stats, isLoading: statsLoading } = useFranchiseStats()
  const { data: businesses, isLoading: businessesLoading } = useBusinesses()
  const { data: branches, isLoading: branchesLoading } = useBranches()

  if (statsLoading || businessesLoading || branchesLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 w-full" /></div>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Franchise</h1>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-0 text-xs font-semibold">Super Admin</Badge>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">Multi-branch management, royalty tracking, and inter-branch transfers.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Branches</CardTitle>
            <Network className="w-5 h-5 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-950 dark:text-zinc-50">{stats?.totalBranches || 0}</div>
            <p className="text-xs mt-1 text-zinc-500">Across all outlets</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Network Revenue</CardTitle>
            <IndianRupee className="w-5 h-5 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-950 dark:text-zinc-50">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs mt-1 text-zinc-500">Calculated this month</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Staff</CardTitle>
            <Users className="w-5 h-5 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-950 dark:text-zinc-50">{stats?.totalStaff || 0}</div>
            <p className="text-xs mt-1 text-zinc-500">Onboarded team</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Businesses</CardTitle>
            <Shield className="w-5 h-5 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-950 dark:text-zinc-50">{stats?.totalBusinesses || 0}</div>
            <p className="text-xs mt-1 text-zinc-500">Verified entities</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg w-fit">
        {(['overview', 'transfers', 'royalty'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors ${activeTab === tab ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
          >
            {tab === 'overview' ? 'Branch Overview' : tab === 'transfers' ? 'Item Transfers' : 'Royalty Tracking'}
          </button>
        ))}
      </div>

      {/* Branch Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches?.map((branch) => (
            <Card key={branch.id} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{branch.name} ({branch.prefix})</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {branch.location || 'No location set'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 text-xs text-nowrap">Online</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Functional</p>
                    <p className="text-xs font-medium flex items-center gap-0.5 mt-0.5 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-3 h-3" /> Active status
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Subdomain</p>
                    <p className="text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300">
                      {businesses?.find(b => b.id === branch.business_id)?.subdomain || 'internal'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">Prefix</p>
                    <p className="text-sm font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">{branch.prefix}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">Contact</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 px-2 truncate" title={branch.contact}>{branch.contact || '-'}</p>
                  </div>
                </div>

                <a 
                  href={`https://${businesses?.find(b => b.id === branch.business_id)?.subdomain}.echo.app`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors w-full h-9"
                >
                  <Eye className="w-4 h-4 mr-2" /> Visit Branch
                </a>
                {/* 
                <Button variant="outline" className="w-full h-9 text-sm border-zinc-200 dark:border-zinc-800 shadow-sm" asChild={true}>
                  <a href={`https://${businesses?.find(b => b.id === branch.business_id)?.subdomain}.echo.app`} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-2" /> Visit Branch
                  </a>
                </Button> 
                */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Item Transfers */}
      {activeTab === 'transfers' && (
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <CardTitle className="text-base">Inter-Branch Transfers</CardTitle>
              <CardDescription>{TRANSFERS.length} transfers this month</CardDescription>
            </div>
            <Button className="bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold h-9 px-4">
              <ArrowRightLeft className="w-4 h-4 mr-2" /> New Transfer
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left text-xs font-semibold uppercase text-zinc-500 tracking-wider px-6 py-3">ID</th>
                  <th className="text-left text-xs font-semibold uppercase text-zinc-500 tracking-wider px-6 py-3">Item</th>
                  <th className="text-left text-xs font-semibold uppercase text-zinc-500 tracking-wider px-6 py-3">Route</th>
                  <th className="text-left text-xs font-semibold uppercase text-zinc-500 tracking-wider px-6 py-3">Date</th>
                  <th className="text-left text-xs font-semibold uppercase text-zinc-500 tracking-wider px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {TRANSFERS.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-mono font-medium text-zinc-900 dark:text-zinc-100">{t.id}</td>
                    <td className="px-6 py-3.5 text-sm text-zinc-700 dark:text-zinc-300">{t.item}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="font-medium">{t.from}</span>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-medium">{t.to}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-zinc-500">{t.date}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant="outline" className={`text-xs font-medium ${t.status === 'delivered' ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300' :
                          t.status === 'in_transit' ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300' :
                            'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300'
                        }`}>
                        {t.status === 'in_transit' ? 'In Transit' : t.status === 'delivered' ? 'Delivered' : 'Pending'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Royalty Tracking */}
      {activeTab === 'royalty' && (
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Royalty Summary — March 2026</CardTitle>
            <CardDescription>Auto-calculated at 10% of branch revenue</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left text-xs font-semibold uppercase text-zinc-500 tracking-wider px-6 py-3">Branch</th>
                  <th className="text-right text-xs font-semibold uppercase text-zinc-500 tracking-wider px-6 py-3">Revenue</th>
                  <th className="text-right text-xs font-semibold uppercase text-zinc-500 tracking-wider px-6 py-3">Rate</th>
                  <th className="text-right text-xs font-semibold uppercase text-zinc-500 tracking-wider px-6 py-3">Royalty Due</th>
                  <th className="text-left text-xs font-semibold uppercase text-zinc-500 tracking-wider px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {BRANCHES.map((branch) => (
                  <tr key={branch.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{branch.name}</div>
                      <div className="text-xs text-zinc-500">{branch.location}</div>
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">{branch.revenue}</td>
                    <td className="px-6 py-3.5 text-right text-sm text-zinc-500">{branch.royaltyPct}%</td>
                    <td className="px-6 py-3.5 text-right text-sm font-bold text-[#ccff00]">{branch.royalty}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant="outline" className="text-xs font-medium border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300">Pending</Badge>
                    </td>
                  </tr>
                ))}
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">Total</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-zinc-900 dark:text-zinc-100">₹28,60,000</td>
                  <td className="px-6 py-4 text-right text-sm text-zinc-500">—</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-[#ccff00]">₹2,86,000</td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
