'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useItems } from '@/lib/queries/useItems'
import { QuickAddModal } from '@/components/inventory/QuickAddModal'
import { BulkImportModal } from '@/components/inventory/BulkImportModal'
import { BatchOperations } from '@/components/inventory/BatchOperations'
import { WashingQueue } from '@/components/inventory/WashingQueue'
import { RepairOversight } from '@/components/inventory/RepairOversight'
import { RevenueOptimiser } from '@/components/analytics/RevenueOptimiser'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Tag, 
  Settings2, 
  Package, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Droplets,
  Wrench,
  BarChart3,
  ShieldCheck,
  History,
  Loader2
} from 'lucide-react'

export default function InventoryPage() {
  const router = useRouter()
  const { data: items, isLoading } = useItems()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const displayItems = useMemo(() => {
    if (!items) return []
    if (!search) return items
    const s = search.toLowerCase()
    return items.filter(i => 
      i.name.toLowerCase().includes(s) || 
      (i.sku && i.sku.toLowerCase().includes(s))
    )
  }, [items, search])

  const selectedItems = useMemo(() => {
    return displayItems.filter(i => selectedIds.has(i.id))
  }, [displayItems, selectedIds])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }
  
  const toggleSelectAll = () => {
    if (selectedIds.size === displayItems.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(displayItems.map(i => i.id)))
  }

  const totalItems = items?.length || 0
  const availableItems = items?.filter(i => i.status === 'available').length || 0
  const maintenanceItems = items?.filter(i => i.status === 'maintenance' || i.status === 'repair').length || 0
  const washingItems = items?.filter(i => i.status === 'washing' || i.status === 'dirty' || i.status === 'cleaning').length || 0

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-3 italic">
            <Package className="h-8 w-8 text-[#ccff00]" />
            ASSET LEDGER
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Rental Catalog & High-Value Inventory Systems</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-zinc-200 hidden md:flex">
             <History className="h-4 w-4 mr-2" /> Stock History
          </Button>
          <BulkImportModal />
          <QuickAddModal />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-8 rounded-[2rem] border-none bg-zinc-900 text-white relative overflow-hidden group shadow-2xl">
          <div className="relative z-10">
             <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-4">Master Stock</p>
             <div className="flex items-baseline gap-2">
               <p className="text-5xl font-black italic tracking-tighter">{totalItems}</p>
               <span className="text-xs font-bold text-zinc-500">Units</span>
             </div>
          </div>
          <Package className="absolute -right-4 -bottom-4 w-32 h-32 text-[#ccff00] opacity-5 group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div className="p-8 rounded-[2rem] border-none bg-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
             <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-4">Operational</p>
             <div className="flex items-baseline gap-2">
               <p className="text-5xl font-black italic tracking-tighter text-zinc-900">{availableItems}</p>
               <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-1" />
             </div>
          </div>
          <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-zinc-50 group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div className="p-8 rounded-[2rem] border-none bg-[#ccff00] shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
             <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mb-4">In Transit / Wash</p>
             <div className="flex items-baseline gap-2">
               <p className="text-5xl font-black italic tracking-tighter text-black">{washingItems}</p>
               <Droplets className="h-4 w-4 text-black/40 mb-1" />
             </div>
          </div>
          <Droplets className="absolute -right-4 -bottom-4 w-32 h-32 text-black opacity-5 group-hover:scale-110 transition-transform duration-700" />
        </div>
        <div className="p-8 rounded-[2rem] border-none bg-red-50 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
             <p className="text-[10px] text-red-900/40 font-black uppercase tracking-[0.2em] mb-4">Maintenance</p>
             <div className="flex items-baseline gap-2">
               <p className="text-5xl font-black italic tracking-tighter text-red-600">{maintenanceItems}</p>
               <Wrench className="h-4 w-4 text-red-400 mb-1" />
             </div>
          </div>
          <AlertCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-red-200 opacity-20 group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="bg-zinc-100/50 p-1 rounded-2xl w-full flex overflow-x-auto hide-scrollbar border border-zinc-200 mb-8 h-12">
          <TabsTrigger value="list" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-black text-[10px] uppercase tracking-widest gap-2">
             <Package className="h-3 w-3" /> Master Catalog
          </TabsTrigger>
          <TabsTrigger value="washing" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-black text-[10px] uppercase tracking-widest gap-2">
             <Droplets className="h-3 w-3" /> Washing Queue
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-black text-[10px] uppercase tracking-widest gap-2 relative">
             <Wrench className="h-3 w-3" /> Repair Oversite
             {maintenanceItems > 0 && (
               <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
             )}
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xl font-black text-[10px] uppercase tracking-widest gap-2">
             <BarChart3 className="h-3 w-3" /> Revenue Gems
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <BatchOperations 
            selectedItems={selectedItems} 
            clearSelection={() => setSelectedIds(new Set())} 
          />

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                placeholder="Search inventory by SKU, name, or category..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 bg-white border-zinc-200 rounded-xl shadow-sm text-sm"
              />
            </div>
            <Button variant="outline" className="gap-2 h-12 px-6 rounded-xl border-zinc-200 font-bold text-xs uppercase tracking-widest">
              <Tag className="w-4 h-4 text-zinc-400" /> Filter Categories
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-zinc-200 ml-auto">
              <Settings2 className="w-4 h-4 text-zinc-400" />
            </Button>
          </div>

          <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow className="border-zinc-100 hover:bg-transparent">
                  <TableHead className="w-[80px] text-center">
                    <input 
                      type="checkbox" 
                      checked={displayItems.length > 0 && selectedIds.size === displayItems.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-zinc-950 rounded" 
                    />
                  </TableHead>
                  <TableHead className="w-[140px] text-[10px] font-black uppercase tracking-widest text-zinc-400">SKU Basis</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Asset Name</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Classification</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-zinc-400 px-8">Daily Yield</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && displayItems.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                           <Loader2 className="h-12 w-12 animate-spin text-zinc-400" />
                           <p className="text-xs font-black uppercase tracking-widest">Synchronizing Ledger...</p>
                        </div>
                     </TableCell>
                   </TableRow>
                ) : displayItems.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="group border-zinc-50 hover:bg-zinc-50/80 cursor-pointer transition-all duration-300"
                    onClick={() => router.push(`/inventory/${item.id}`)}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 accent-zinc-950 rounded cursor-pointer" 
                      />
                    </TableCell>
                    <TableCell className="font-mono text-[10px] font-black text-zinc-400 tracking-tighter uppercase group-hover:text-zinc-900 transition-colors">#{item.sku || 'N/A'}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                             {item.name[0]}
                          </div>
                          <span className="text-sm font-black text-zinc-900 tracking-tight">{item.name}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-zinc-50/50 text-[10px] font-bold text-zinc-500 border-zinc-200 px-3 h-5">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest h-6 px-3",
                          item.status === 'available' ? "bg-emerald-600 text-white border-none shadow-lg shadow-emerald-100" :
                          item.status === 'maintenance' ? "bg-amber-500 text-white border-none shadow-lg shadow-amber-100" :
                          item.status === 'washing' ? "bg-blue-600 text-white border-none shadow-lg shadow-blue-100" :
                          "bg-zinc-200 text-zinc-600 border-none px-3"
                        )}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black italic tracking-tighter text-lg px-8">
                      ₹{item.price?.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="washing" className="animate-in slide-in-from-bottom-4 duration-700">
           <WashingQueue />
        </TabsContent>

        <TabsContent value="maintenance" className="animate-in slide-in-from-bottom-4 duration-700">
           <RepairOversight />
        </TabsContent>

        <TabsContent value="revenue" className="animate-in slide-in-from-bottom-4 duration-700">
           <RevenueOptimiser />
        </TabsContent>
      </Tabs>
    </div>
  )
}
