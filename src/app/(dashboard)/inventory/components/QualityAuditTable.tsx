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
    fair: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    poor: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20',
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
      <Card className="border-dashed border-2 border-border shadow-none bg-muted/40">
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-medium text-foreground">All Clear!</p>
          <p className="text-sm">There are currently no items flagged for quality issues.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border bg-card text-card-foreground">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search flagged items..." 
              className="pl-10 h-9 bg-muted border-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {filteredItems.map(item => (
          <Card key={item.id} className={
            loadingId === item.id
              ? 'opacity-50 pointer-events-none'
              : 'cursor-pointer border bg-card text-card-foreground transition-all active:scale-[0.99]'
          }>
            <CardContent className="flex gap-3 p-3">
              {item.cover_image_url ? (
                <img src={item.cover_image_url} alt={item.name} className="h-16 w-16 rounded-xl border border-border object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku || 'N/A'} ? {item.total_rentals} rentals</p>
                  </div>
                  <Badge variant="outline" className={`${CONDITION_COLORS[item.condition]} font-bold uppercase`}>{item.condition}</Badge>
                </div>
                {item.condition_notes && <p className="line-clamp-2 text-xs text-muted-foreground">{item.condition_notes}</p>}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{item.status.replace('_', ' ')}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">Manage</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Audit Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleSendToMaintenance(item.id)}>Send to Maintenance</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => handleRetireItem(item.id)}>Retire Item</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden border bg-card text-card-foreground md:block">
        <Table>
          <TableHeader className="bg-muted/40">
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
                    <img src={item.cover_image_url} alt={item.name} className="w-12 h-12 rounded object-cover border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center border border-border">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {item.sku || 'N/A'}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${CONDITION_COLORS[item.condition]} font-bold uppercase`}>
                    {item.condition}
                  </Badge>
                  {item.condition_notes && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={item.condition_notes}>
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
                        className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
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
