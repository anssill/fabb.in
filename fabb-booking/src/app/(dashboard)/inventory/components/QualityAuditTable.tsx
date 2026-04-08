'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, Search, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateItemStatus } from '../inventory-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function QualityAuditTable({ auditItems }: { auditItems: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  const filteredItems = auditItems.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (i.sku && i.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const CONDITION_COLORS: Record<string, string> = {
    fair: 'bg-amber-100 text-amber-700 border-amber-200',
    poor: 'bg-red-100 text-red-700 border-red-200',
  }

  async function handleSendToMaintenance(itemId: string) {
    setLoadingId(itemId)
    try {
      await updateItemStatus(itemId, 'maintenance')
      toast.success('Item moved to maintenance.')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleRetireItem(itemId: string) {
    setLoadingId(itemId)
    try {
      await updateItemStatus(itemId, 'retired')
      toast.success('Item retired.')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoadingId(null)
    }
  }

  if (auditItems.length === 0) {
    return (
      <Card className="border-dashed border-2 shadow-none bg-slate-50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-lg font-medium text-slate-900">All Clear!</p>
          <p className="text-sm">There are currently no items flagged for quality issues.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search flagged items..." 
              className="pl-10 h-9 bg-slate-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Item Details</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rentals</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map(item => (
              <TableRow key={item.id} className={loadingId === item.id ? 'opacity-50 pointer-events-none' : ''}>
                <TableCell>
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt={item.name} className="w-12 h-12 rounded object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center border">
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">SKU: {item.sku || 'N/A'}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${CONDITION_COLORS[item.condition]} font-bold uppercase`}>
                    {item.condition}
                  </Badge>
                  {item.condition_notes && (
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={item.condition_notes}>
                      {item.condition_notes}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.status.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{item.total_rentals}</span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">Manage Option</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Audit Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleSendToMaintenance(item.id)}>
                        Send to Maintenance
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        onClick={() => handleRetireItem(item.id)}
                      >
                        Retire Item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
