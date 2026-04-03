'use client'

import { useWishlist } from '@/lib/queries/useItems'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Heart, Bell, BellOff } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

export default function WishlistPage() {
  const { data: entries = [], isLoading } = useWishlist()

  const pendingNotifications = entries.filter(
    (e: any) => !e.notified && e.item?.status === 'available'
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="border border-zinc-200">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
          <p className="text-zinc-500 mt-1">Customers waiting for items to become available.</p>
        </div>
      </div>

      {/* Alert Banner */}
      {pendingNotifications.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 flex items-center gap-3">
          <Bell className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {pendingNotifications.length} customer{pendingNotifications.length > 1 ? 's' : ''} can be notified!
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              These items are now available. Send a WhatsApp or make a call.
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-pink-50/50 border-pink-200">
          <p className="text-xs font-bold uppercase text-pink-700 tracking-wider">Total Waiting</p>
          <p className="text-2xl font-bold font-mono mt-1 text-pink-800">{entries.length}</p>
        </div>
        <div className="p-4 rounded-xl border bg-emerald-50/50 border-emerald-200">
          <p className="text-xs font-bold uppercase text-emerald-700 tracking-wider">Ready to Notify</p>
          <p className="text-2xl font-bold font-mono mt-1 text-emerald-800">{pendingNotifications.length}</p>
        </div>
        <div className="p-4 rounded-xl border bg-zinc-50 border-zinc-200">
          <p className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Already Notified</p>
          <p className="text-2xl font-bold font-mono mt-1">{entries.filter((e: any) => e.notified).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow className="border-zinc-200 hover:bg-transparent">
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Item</TableHead>
              <TableHead className="font-semibold text-center">Item Status</TableHead>
              <TableHead className="font-semibold">Requested</TableHead>
              <TableHead className="font-semibold text-center">Notified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500">Loading wishlist...</TableCell></TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-400">
                  <Heart className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">No wishlist entries yet</p>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry: any) => {
                const itemAvailable = entry.item?.status === 'available'
                return (
                  <TableRow key={entry.id} className={`border-zinc-200 hover:bg-zinc-50 transition-colors ${
                    itemAvailable && !entry.notified ? 'bg-amber-50/50' : ''
                  }`}>
                    <TableCell className="font-medium">{entry.customer?.name || '-'}</TableCell>
                    <TableCell className="font-mono text-zinc-500">{entry.customer?.phone || '-'}</TableCell>
                    <TableCell className="font-medium">{entry.item?.name || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        itemAvailable ? 'bg-emerald-100 text-emerald-800 border-0' : 'bg-zinc-100 text-zinc-600 border-0'
                      } variant="secondary">
                        {entry.item?.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      {entry.created_at ? format(parseISO(entry.created_at), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.notified ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">
                          <Bell className="w-3 h-3 mr-1" /> Notified
                        </Badge>
                      ) : (
                        <BellOff className="w-4 h-4 text-zinc-400 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
