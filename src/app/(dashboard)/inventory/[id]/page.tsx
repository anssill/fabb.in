import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Archive, BarChart3, CalendarCheck, ChevronLeft, Edit, IndianRupee, Package, Plus, QrCode, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isValidUuid } from '@/lib/api-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ItemTag } from './components/ItemTag'
import { AvailabilityCalendar } from './components/AvailabilityCalendar'
import { addBundleComponent, archiveInventoryAsset, archiveItem, registerInventoryAsset, removeBundleComponent } from '../inventory-actions'

export default async function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isValidUuid(id)) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const db = supabase as any
  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff?.business_id || !staff.branch_id) notFound()
  const { data: item } = await db.from('items').select(`id, business_id, branch_id, name, sku, category, description, cover_image_url, price, deposit_amount, storage_location, total_rentals, total_revenue, tracking_mode, replacement_value, designer, brand, occasion, fabric, is_bundle, item_variants(id, size, total_stock, price_override, branch_id, archived_at)`).eq('id', id).eq('business_id', staff.business_id).eq('item_variants.branch_id', staff.branch_id).is('item_variants.archived_at', null).single()
  if (!item) notFound()

  const [{ data: recentBookings }, { data: assets }, { data: unavailable }, { data: bundleComponents }, { data: componentVariants }] = await Promise.all([
    db.from('booking_items').select('quantity, size, booking:bookings(id, booking_number, status, pickup_date, return_date, customer:customers(name))').eq('item_id', id).order('created_at', { ascending: false }).limit(6),
    db.from('inventory_assets').select('id, asset_code, status, item_variant_id, acquired_on, acquisition_cost, storage_location, variant:item_variants(size)').eq('item_id', id).eq('branch_id', staff.branch_id).is('archived_at', null).order('asset_code').limit(250),
    db.from('inventory_unavailability').select('id, reason, quantity, restored_quantity, item_variant_id, recorded_at').eq('item_id', id).filter('restored_quantity', 'lt', 'quantity'),
    db.from('item_bundle_components').select('id, name, quantity, required, component:items!item_bundle_components_component_item_id_fkey(name,sku), variant:item_variants!item_bundle_components_component_variant_id_fkey(size)').eq('bundle_item_id', id).order('created_at'),
    db.from('item_variants').select('id, size, item_id, item:items!inner(name,sku)').eq('business_id', staff.business_id).eq('branch_id', staff.branch_id).neq('item_id', id).is('archived_at', null).eq('items.is_active', true).order('size').limit(500),
  ])
  const { data: branch } = await supabase.from('branches').select('name').eq('id', staff.branch_id).single()
  const variants = item.item_variants ?? []
  const totalStock = variants.reduce((sum: number, variant: { total_stock: number }) => sum + variant.total_stock, 0)
  const blocked = (unavailable ?? []).reduce((sum: number, entry: { quantity: number; restored_quantity: number }) => sum + entry.quantity - entry.restored_quantity, 0)

  async function archive() {
    'use server'
    await archiveItem(id)
    redirect('/inventory')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link href="/inventory"><ChevronLeft className="mr-1 h-4 w-4" />Back</Link></Button>
          <div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold">{item.name}</h1><Badge variant="secondary">{item.tracking_mode === 'asset' ? 'Asset tracked' : 'Quantity tracked'}</Badge>{item.is_bundle && <Badge>Bundle</Badge>}</div><p className="text-sm text-muted-foreground">{item.sku || 'No SKU'} · {item.category} · {branch?.name || 'Branch'}</p></div>
        </div>
        <div className="flex gap-2"><Button variant="outline" size="sm" asChild><Link href={`/inventory/${id}/edit`}><Edit className="mr-1 h-4 w-4" />Edit</Link></Button><form action={archive}><Button variant="outline" size="sm" className="text-amber-700"><Archive className="mr-1 h-4 w-4" />Archive</Button></form></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden"><CardContent className="p-0"><div className="relative aspect-[16/8] bg-muted">{item.cover_image_url ? <Image src={item.cover_image_url} alt={item.name} fill priority sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" /> : <div className="grid h-full place-items-center"><Package className="h-16 w-16 text-muted-foreground/30" /></div>}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Size and physical stock</CardTitle></CardHeader><CardContent><div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="p-3">Size</th><th className="p-3 text-center">Physical units</th><th className="p-3 text-center">Blocked now</th><th className="p-3 text-right">Rental rate</th></tr></thead><tbody className="divide-y">{variants.map((variant: { id: string; size: string; total_stock: number; price_override: number | null }) => { const variantBlocked = (unavailable ?? []).filter((entry: { item_variant_id: string }) => entry.item_variant_id === variant.id).reduce((sum: number, entry: { quantity: number; restored_quantity: number }) => sum + entry.quantity - entry.restored_quantity, 0); return <tr key={variant.id}><td className="p-3 font-medium">{variant.size}</td><td className="p-3 text-center">{variant.total_stock}</td><td className="p-3 text-center">{variantBlocked}</td><td className="p-3 text-right">₹{Number(variant.price_override ?? item.price).toLocaleString('en-IN')}</td></tr> })}</tbody></table></div></CardContent></Card>
          {item.tracking_mode === 'asset' ? <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><QrCode className="h-4 w-4 text-primary" />Premium asset pieces</CardTitle></CardHeader><CardContent className="space-y-4"><form action={registerInventoryAsset.bind(null, id)} className="grid gap-3 rounded-xl border bg-muted/20 p-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end"><div className="space-y-1.5"><Label htmlFor="asset-size">Size</Label><select id="asset-size" name="item_variant_id" required className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Choose</option>{variants.map((variant: { id: string; size: string }) => <option key={variant.id} value={variant.id}>{variant.size}</option>)}</select></div><div className="space-y-1.5"><Label htmlFor="asset-code">Asset code / QR</Label><Input id="asset-code" name="asset_code" required placeholder="FABB-0001" /></div><div className="space-y-1.5"><Label htmlFor="asset-date">Acquired on</Label><Input id="asset-date" name="acquired_on" type="date" /></div><div className="space-y-1.5"><Label htmlFor="asset-cost">Acquisition cost</Label><Input id="asset-cost" name="acquisition_cost" type="number" min={0} step="0.01" /></div><Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" />Register</Button><Input name="storage_location" placeholder="Rack / location (optional)" className="md:col-span-4" /></form>{assets?.length ? <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="p-3">Asset code</th><th className="p-3">Size</th><th className="p-3">Status</th><th className="p-3">Acquired</th><th className="p-3 text-right">Cost</th><th className="p-3"></th></tr></thead><tbody className="divide-y">{assets.map((asset: any) => { const assetVariant = Array.isArray(asset.variant) ? asset.variant[0] : asset.variant; return <tr key={asset.id}><td className="p-3 font-mono font-medium">{asset.asset_code}</td><td className="p-3">{assetVariant?.size || '—'}</td><td className="p-3"><Badge variant="outline" className="capitalize">{asset.status.replaceAll('_', ' ')}</Badge></td><td className="p-3">{asset.acquired_on || '—'}</td><td className="p-3 text-right">{asset.acquisition_cost == null ? '—' : `₹${Number(asset.acquisition_cost).toLocaleString('en-IN')}`}</td><td className="p-3 text-right">{!['reserved', 'out', 'in_transit'].includes(asset.status) ? <form action={archiveInventoryAsset.bind(null, id, asset.id)}><Button type="submit" size="icon-sm" variant="ghost" aria-label={`Archive ${asset.asset_code}`}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></form> : null}</td></tr> })}</tbody></table></div> : <p className="py-4 text-center text-sm text-muted-foreground">No asset pieces registered yet.</p>}</CardContent></Card> : null}
          {item.is_bundle ? <Card><CardHeader><CardTitle className="text-base">Bundle components</CardTitle></CardHeader><CardContent className="space-y-4"><form action={addBundleComponent.bind(null, id)} className="grid gap-3 rounded-xl border bg-muted/20 p-3 md:grid-cols-[1.5fr_1fr_100px_auto_auto] md:items-end"><div className="space-y-1.5"><Label htmlFor="component-variant">Product / size</Label><select id="component-variant" name="component_variant_id" required className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Choose component</option>{(componentVariants ?? []).map((variant: any) => { const componentItem = Array.isArray(variant.item) ? variant.item[0] : variant.item; return <option key={variant.id} value={variant.id}>{componentItem?.name} · {variant.size} · {componentItem?.sku || 'No SKU'}</option> })}</select></div><div className="space-y-1.5"><Label htmlFor="component-name">Piece name</Label><Input id="component-name" name="name" required placeholder="Jacket" /></div><div className="space-y-1.5"><Label htmlFor="component-quantity">Qty</Label><Input id="component-quantity" name="quantity" type="number" min={1} defaultValue={1} required /></div><label className="flex h-10 items-center gap-2 text-sm"><input name="required" type="checkbox" defaultChecked />Required</label><Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" />Add</Button></form>{bundleComponents?.length ? <div className="divide-y rounded-xl border">{bundleComponents.map((component: any) => { const componentItem = Array.isArray(component.component) ? component.component[0] : component.component; const componentVariant = Array.isArray(component.variant) ? component.variant[0] : component.variant; return <div key={component.id} className="flex items-center justify-between gap-3 p-3"><div><p className="font-medium">{component.name} × {component.quantity}</p><p className="text-xs text-muted-foreground">{componentItem?.name} · {componentVariant?.size || 'Any size'} · {component.required ? 'Required' : 'Optional'}</p></div><form action={removeBundleComponent.bind(null, id, component.id)}><Button type="submit" size="icon-sm" variant="ghost" aria-label={`Remove ${component.name}`}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></form></div> })}</div> : <p className="py-4 text-center text-sm text-muted-foreground">No bundle pieces configured yet.</p>}</CardContent></Card> : null}
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarCheck className="h-4 w-4 text-primary" />Recent rentals</CardTitle></CardHeader><CardContent>{recentBookings?.length ? <div className="divide-y">{recentBookings.map((line: any, index: number) => { const booking = Array.isArray(line.booking) ? line.booking[0] : line.booking; const customer = Array.isArray(booking?.customer) ? booking.customer[0] : booking?.customer; return booking ? <Link key={`${booking.id}-${index}`} href={`/bookings/${booking.id}`} className="flex items-center justify-between rounded-lg px-2 py-3 hover:bg-muted"><div><p className="font-medium">{booking.booking_number}</p><p className="text-xs text-muted-foreground">{customer?.name || 'Customer'} · {line.size} × {line.quantity}</p></div><div className="text-right"><Badge variant="outline" className="capitalize">{booking.status}</Badge><p className="mt-1 text-xs text-muted-foreground">{booking.pickup_date} → {booking.return_date}</p></div></Link> : null })}</div> : <p className="py-6 text-center text-sm text-muted-foreground">No rentals yet.</p>}</CardContent></Card>
        </div>

        <div className="space-y-5">
          <Card><CardContent className="space-y-3 p-5"><Stat icon={Package} label="Physical stock" value={totalStock} /><Stat icon={Archive} label="Damaged / missing" value={blocked} /><Stat icon={QrCode} label="Tagged assets" value={assets?.length ?? 0} /><Stat icon={BarChart3} label="Total rentals" value={item.total_rentals ?? 0} /><Stat icon={IndianRupee} label="Revenue" value={`₹${Number(item.total_revenue ?? 0).toLocaleString('en-IN')}`} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Rental information</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><Info label="Base rate" value={`₹${Number(item.price).toLocaleString('en-IN')}`} /><Info label="Deposit" value={`₹${Number(item.deposit_amount ?? 0).toLocaleString('en-IN')}`} /><Info label="Replacement value" value={`₹${Number(item.replacement_value ?? 0).toLocaleString('en-IN')}`} /><Info label="Storage" value={item.storage_location || '—'} /><Info label="Brand" value={item.brand || item.designer || '—'} /></CardContent></Card>
          {item.description && <Card><CardHeader><CardTitle className="text-sm">Description</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.description}</p></CardContent></Card>}
          <ItemTag item={{ sku: item.sku, name: item.name, category: item.category }} />
        </div>
      </div>
      <AvailabilityCalendar itemId={id} businessId={item.business_id} branchId={staff.branch_id} variants={variants} />
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string | number }) { return <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted-foreground"><span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>{label}</span><strong className="text-sm">{value}</strong></div> }
function Info({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div> }
