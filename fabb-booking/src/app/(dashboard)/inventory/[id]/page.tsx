import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft, Package, Edit, Trash2, BarChart3,
  CalendarCheck, IndianRupee, Waves,
} from 'lucide-react'
import Link from 'next/link'
import { ItemTag } from './components/ItemTag'

const CONDITION_COLORS: Record<string, string> = {
  excellent: 'bg-green-100 text-green-700',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-700',
}

export default async function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('items')
    .select(`
      *,
      item_variants(id, size, colour, total_stock, available_stock, reserved_stock, price_override, is_active),
      branch:branches(name)
    `)
    .eq('id', id)
    .single()

  if (!item) notFound()

  const branch = Array.isArray(item.branch) ? item.branch[0] : item.branch
  const totalStock = (item.item_variants || []).reduce((s: number, v: { total_stock: number }) => s + v.total_stock, 0)
  const availableStock = (item.item_variants || []).reduce((s: number, v: { available_stock: number }) => s + v.available_stock, 0)
  const reservedStock = (item.item_variants || []).reduce((s: number, v: { reserved_stock: number }) => s + v.reserved_stock, 0)

  // Recent bookings for this item
  const { data: recentBookings } = await supabase
    .from('booking_items')
    .select('booking:bookings(id, booking_number, status, pickup_date, return_date, customer:customers(name))')
    .eq('item_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/inventory"><ChevronLeft className="w-4 h-4 mr-1" />Back</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">{item.name}</h1>
              <Badge className={`text-xs ${CONDITION_COLORS[item.condition] || ''}`}>{item.condition}</Badge>
            </div>
            <p className="text-sm text-slate-500">{item.sku} · {item.category} · {branch?.name || 'Branch'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-1" />Edit</Button>
          <Button variant="outline" size="sm" className="text-red-600"><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cover Image */}
          <Card>
            <CardContent className="p-0">
              <div className="aspect-[16/9] bg-slate-100 flex items-center justify-center rounded-lg overflow-hidden">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-16 h-16 text-slate-300" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Size & Stock Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b">
                      <th className="pb-2 font-medium">Size</th>
                      <th className="pb-2 font-medium">Colour</th>
                      <th className="pb-2 font-medium text-center">Total</th>
                      <th className="pb-2 font-medium text-center">Available</th>
                      <th className="pb-2 font-medium text-center">Reserved</th>
                      <th className="pb-2 font-medium text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(item.item_variants || []).map((v: Record<string, unknown>) => (
                      <tr key={v.id as string} className={!(v.is_active as boolean) ? 'opacity-50' : ''}>
                        <td className="py-2.5 font-medium">{v.size as string}</td>
                        <td className="py-2.5 text-slate-600">{(v.colour as string) || '—'}</td>
                        <td className="py-2.5 text-center">{v.total_stock as number}</td>
                        <td className="py-2.5 text-center">
                          <span className={`font-medium ${(v.available_stock as number) === 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {v.available_stock as number}
                          </span>
                        </td>
                        <td className="py-2.5 text-center text-amber-600">{v.reserved_stock as number}</td>
                        <td className="py-2.5 text-right">
                          {(v.price_override as number) ? `₹${(v.price_override as number).toLocaleString('en-IN')}` : `₹${item.daily_rate}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings && recentBookings.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentBookings.map((bi, i) => {
                    const booking = Array.isArray(bi.booking) ? bi.booking[0] : bi.booking
                    if (!booking) return null
                    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                    return (
                      <Link key={i} href={`/bookings/${booking.id}`} className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors">
                        <div>
                          <p className="text-sm font-medium">{booking.booking_number}</p>
                          <p className="text-xs text-slate-500">{customer?.name || 'Customer'}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs capitalize">{booking.status}</Badge>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} → {booking.return_date ? new Date(booking.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No bookings yet for this item</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-slate-600">Stock</span>
                </div>
                <span className="text-sm font-semibold">{availableStock}/{totalStock}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm text-slate-600">Reserved</span>
                </div>
                <span className="text-sm font-semibold">{reservedStock}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-slate-600">Total Rentals</span>
                </div>
                <span className="text-sm font-semibold">{item.total_rentals || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-600">Revenue</span>
                </div>
                <span className="text-sm font-semibold">₹{Number(item.total_revenue || 0).toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Daily Rate</span>
                <span className="font-medium">₹{item.daily_rate}</span>
              </div>
              {item.deposit_amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Deposit</span>
                  <span>₹{item.deposit_amount}</span>
                </div>
              )}
              {item.purchase_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Purchase Price</span>
                  <span>₹{item.purchase_price}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {item.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <Button variant="outline" className="w-full" size="sm">
                <Waves className="w-4 h-4 mr-2" />
                Send to Wash
              </Button>
            </CardContent>
          </Card>

          {/* QR Tag */}
          <ItemTag item={{ sku: item.sku, name: item.name, category: item.category }} />
        </div>
      </div>
    </div>
  )
}
