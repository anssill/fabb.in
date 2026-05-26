'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ClipboardCheck,
  Loader2,
  PackageCheck,
  PenLine,
  Truck,
  UserRoundCheck,
  AlertTriangle,
  Scissors,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { getOperationStatus, getOperationStatusClass } from '@/lib/operations'
import type { OperationSettings } from '@/lib/operation-settings'

type ChecklistItem = {
  id: string
  section: string
  item_key: string
  label: string
  is_required: boolean
  is_blocking: boolean
  is_completed: boolean
}

type Task = {
  id: string
  task_type: string
  title: string
  status: string
  priority: string
  due_at?: string | null
}

type BookingItem = {
  id: string
  item_name?: string | null
  size?: string | null
  prep_status?: string | null
  scan_status?: string | null
  alteration_status?: string | null
  accessory_notes?: string | null
  bag_hanger_code?: string | null
  condition_before_pickup?: string | null
}

type Delivery = {
  mode?: string | null
  status?: string | null
  address?: string | null
  contact_person?: string | null
  contact_phone?: string | null
  delivery_fee?: number | string | null
  assigned_staff_id?: string | null
  notes?: string | null
}

interface Props {
  settings: OperationSettings
  booking: {
    id: string
    status: string
    business_id: string
    branch_id: string
    handoff_notes?: string | null
    internal_notes?: string | null
    delivery_mode?: string | null
    delivery_status?: string | null
    delivery_fee?: number | string | null
    balance_due?: number | string | null
    deposit_amount?: number | string | null
  }
  checklist: ChecklistItem[]
  tasks: Task[]
  items: BookingItem[]
  delivery?: Delivery | null
  signatures: Array<{ id: string; signature_type: string; signer_name?: string | null; captured_at: string }>
}

const sectionIcons: Record<string, React.ElementType> = {
  customer: UserRoundCheck,
  payment: ClipboardCheck,
  fitting: Scissors,
  prep: PackageCheck,
  pickup: PackageCheck,
  return: ClipboardCheck,
  washing: ClipboardCheck,
  invoice: ClipboardCheck,
}

const taskStatusOptions = ['pending', 'doing', 'done', 'blocked']
const deliveryModes = [
  ['store_pickup', 'Store pickup'],
  ['store_delivery', 'Store delivery'],
  ['courier', 'Courier'],
  ['staff_delivery', 'Staff delivery'],
]
const deliveryStatuses = [
  ['pending', 'Pending'],
  ['out_for_delivery', 'Out for delivery'],
  ['delivered', 'Delivered'],
  ['failed_delivery', 'Failed delivery'],
]

const OPERATIONS_TAB_BUTTON_CLASS = 'h-8 flex-none rounded-lg border border-slate-200 bg-white px-3 py-0 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950 data-active:border-slate-300 data-active:bg-white data-active:text-slate-950 data-active:shadow-md'

export function BookingOperationsPanel({ settings, booking, checklist, tasks, items, delivery, signatures }: Props) {
  const router = useRouter()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [handoffNotes, setHandoffNotes] = useState(booking.handoff_notes || '')
  const [internalNotes, setInternalNotes] = useState(booking.internal_notes || '')
  const [deliveryState, setDeliveryState] = useState({
    mode: delivery?.mode || booking.delivery_mode || 'store_pickup',
    status: delivery?.status || booking.delivery_status || 'pending',
    address: delivery?.address || '',
    contact_person: delivery?.contact_person || '',
    contact_phone: delivery?.contact_phone || '',
    delivery_fee: String(delivery?.delivery_fee ?? booking.delivery_fee ?? 0),
    notes: delivery?.notes || '',
  })
  const [signature, setSignature] = useState({
    type: 'rental_agreement',
    signer_name: '',
    signature_data: '',
  })

  useEffect(() => {
    void fetch(`/api/bookings/${booking.id}/operations`, { method: 'POST' })
  }, [booking.id])

  const groupedChecklist = useMemo(() => {
    return checklist.reduce((acc: Record<string, ChecklistItem[]>, item) => {
      acc[item.section] = acc[item.section] || []
      acc[item.section].push(item)
      return acc
    }, {})
  }, [checklist])

  const blockingMissing = checklist.filter(item => item.is_blocking && !item.is_completed)
  const completedCount = checklist.filter(item => item.is_completed).length
  const checklistPct = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0
  const firstTab =
    settings.checklist ? 'checklist'
      : settings.itemPrep ? 'items'
        : settings.tasks ? 'tasks'
          : settings.delivery ? 'delivery'
            : settings.staffNotes ? 'notes'
              : 'sign'
  const hasAnySection = settings.checklist || settings.itemPrep || settings.tasks || settings.delivery || settings.staffNotes || settings.signatures

  async function patch(body: Record<string, unknown>, successMessage: string, key: string) {
    setLoadingKey(key)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/operations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Operation failed')
      toast.success(successMessage)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Operation failed')
    } finally {
      setLoadingKey(null)
    }
  }

  const markReady = () => {
    if (blockingMissing.length > 0) {
      toast.error(`Complete ${blockingMissing.length} blocking checklist item${blockingMissing.length === 1 ? '' : 's'} first`)
      return
    }
    void patch({ status: 'ready_for_pickup' }, 'Booking marked ready for pickup', 'ready')
  }

  const sendWhatsApp = (template: string) => {
    toast.success(`${template.replace(/_/g, ' ')} preview ready. Connect approved template to send.`)
  }

  return (
    <Card className="border-slate-100 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClipboardCheck className="h-4 w-4 text-blue-600" />
              Operations Workspace
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">Checklist, item prep, tasks, delivery, notes, and signatures.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${getOperationStatusClass(booking.status)} border-0`}>{getOperationStatus(booking.status)}</Badge>
            <Badge variant="outline">{checklistPct}% checklist</Badge>
            {settings.checklist && (
              <Button size="sm" className="h-8" onClick={markReady} disabled={loadingKey === 'ready'}>
                {loadingKey === 'ready' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Ready
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {!hasAnySection ? (
          <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
            Operation sections are turned off for this branch.
          </div>
        ) : (
        <Tabs className="gap-3" defaultValue={firstTab}>
          <TabsList className="flex h-auto w-auto flex-wrap justify-start gap-2 bg-transparent p-0 shadow-none">
            {settings.checklist && <TabsTrigger value="checklist" className={OPERATIONS_TAB_BUTTON_CLASS}>Checklist</TabsTrigger>}
            {settings.itemPrep && <TabsTrigger value="items" className={OPERATIONS_TAB_BUTTON_CLASS}>Items</TabsTrigger>}
            {settings.tasks && <TabsTrigger value="tasks" className={OPERATIONS_TAB_BUTTON_CLASS}>Tasks</TabsTrigger>}
            {settings.delivery && <TabsTrigger value="delivery" className={OPERATIONS_TAB_BUTTON_CLASS}>Delivery</TabsTrigger>}
            {settings.staffNotes && <TabsTrigger value="notes" className={OPERATIONS_TAB_BUTTON_CLASS}>Notes</TabsTrigger>}
            {settings.signatures && <TabsTrigger value="sign" className={OPERATIONS_TAB_BUTTON_CLASS}>Sign</TabsTrigger>}
          </TabsList>

          {settings.checklist && <TabsContent value="checklist" className="mt-0 flex-none space-y-3">
            {blockingMissing.length > 0 && (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{blockingMissing.length} blocking step{blockingMissing.length === 1 ? '' : 's'} pending before ready/pickup.</span>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(groupedChecklist).map(([section, rows]) => {
                const Icon = sectionIcons[section] || ClipboardCheck
                return (
                  <div key={section} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold capitalize text-slate-900">
                      <Icon className="h-4 w-4 text-blue-600" />
                      {section}
                    </h3>
                    <div className="space-y-2">
                      {rows.map((item) => (
                        <label key={item.id} className="flex items-start gap-2 rounded-lg bg-white p-2 text-sm shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                          <Checkbox
                            checked={item.is_completed}
                            disabled={loadingKey === item.id}
                            onCheckedChange={(checked) => patch({
                              checklistItemId: item.id,
                              isCompleted: Boolean(checked),
                            }, checked ? 'Checklist completed' : 'Checklist reopened', item.id)}
                            className="mt-0.5"
                          />
                          <span className="flex-1">
                            <span className="font-medium text-slate-800">{item.label}</span>
                            {(item.is_required || item.is_blocking) && (
                              <span className="ml-2 text-[10px] font-semibold uppercase text-slate-400">
                                {item.is_blocking ? 'Blocking' : 'Required'}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <Button onClick={markReady} disabled={loadingKey === 'ready'}>
                {loadingKey === 'ready' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Ready for pickup
              </Button>
              {settings.whatsappActions && <Button variant="outline" onClick={() => sendWhatsApp('booking_ready')}>
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp ready
              </Button>}
            </div>
          </TabsContent>}

          {settings.itemPrep && <TabsContent value="items" className="mt-0 flex-none space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{item.item_name || 'Item'}</p>
                    <p className="text-xs text-slate-500">Size {item.size || '-'}</p>
                  </div>
                  <Badge variant="outline">{item.prep_status || 'pending'}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Prep</Label>
                    <Select
                      value={item.prep_status || 'pending'}
                      onValueChange={(value) => patch({ itemId: item.id, itemUpdate: { prep_status: value } }, 'Item prep updated', item.id + '-prep')}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['pending', 'picked', 'packed', 'checked', 'blocked'].map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Alteration</Label>
                    <Select
                      value={item.alteration_status || 'not_required'}
                      onValueChange={(value) => patch({ itemId: item.id, itemUpdate: { alteration_status: value } }, 'Alteration status updated', item.id + '-alteration')}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['not_required', 'pending', 'sent_to_tailor', 'completed', 'checked'].map(value => <SelectItem key={value} value={value}>{value.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Bag / hanger</Label>
                    <Input
                      defaultValue={item.bag_hanger_code || ''}
                      onBlur={(event) => patch({ itemId: item.id, itemUpdate: { bag_hanger_code: event.target.value } }, 'Bag code saved', item.id + '-bag')}
                      placeholder="A12 / Hanger 4"
                    />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Textarea
                    defaultValue={item.accessory_notes || ''}
                    onBlur={(event) => patch({ itemId: item.id, itemUpdate: { accessory_notes: event.target.value } }, 'Accessory notes saved', item.id + '-accessory')}
                    placeholder="Accessories: dupatta, belt, jewellery..."
                    rows={2}
                  />
                  <Textarea
                    defaultValue={item.condition_before_pickup || ''}
                    onBlur={(event) => patch({ itemId: item.id, itemUpdate: { condition_before_pickup: event.target.value } }, 'Pickup condition saved', item.id + '-condition')}
                    placeholder="Condition before pickup..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </TabsContent>}

          {settings.tasks && <TabsContent value="tasks" className="mt-0 flex-none space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.priority} priority{task.due_at ? ` · due ${new Date(task.due_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</p>
                </div>
                <Select
                  value={task.status}
                  onValueChange={(value) => patch({ taskId: task.id, taskStatus: value }, 'Task updated', task.id)}
                >
                  <SelectTrigger className="w-full bg-white sm:w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {taskStatusOptions.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {tasks.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Tasks will appear after the checklist initializes.</p>}
          </TabsContent>}

          {settings.delivery && <TabsContent value="delivery" className="mt-0 flex-none space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Delivery mode</Label>
                <Select value={deliveryState.mode} onValueChange={(mode) => setDeliveryState(prev => ({ ...prev, mode }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {deliveryModes.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={deliveryState.status} onValueChange={(status) => setDeliveryState(prev => ({ ...prev, status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {deliveryStatuses.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Contact person</Label>
                <Input value={deliveryState.contact_person} onChange={(e) => setDeliveryState(prev => ({ ...prev, contact_person: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Contact phone</Label>
                <Input value={deliveryState.contact_phone} onChange={(e) => setDeliveryState(prev => ({ ...prev, contact_phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Delivery fee</Label>
                <Input type="number" value={deliveryState.delivery_fee} onChange={(e) => setDeliveryState(prev => ({ ...prev, delivery_fee: e.target.value }))} />
              </div>
            </div>
            <Textarea value={deliveryState.address} onChange={(e) => setDeliveryState(prev => ({ ...prev, address: e.target.value }))} placeholder="Delivery address" rows={2} />
            <Textarea value={deliveryState.notes} onChange={(e) => setDeliveryState(prev => ({ ...prev, notes: e.target.value }))} placeholder="Delivery notes" rows={2} />
            <Button onClick={() => patch({ delivery: deliveryState }, 'Delivery saved', 'delivery')} disabled={loadingKey === 'delivery'}>
              {loadingKey === 'delivery' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
              Save delivery
            </Button>
          </TabsContent>}

          {settings.staffNotes && <TabsContent value="notes" className="mt-0 flex-none space-y-3">
            <Textarea value={handoffNotes} onChange={(e) => setHandoffNotes(e.target.value)} placeholder="Handoff notes for next shift..." rows={3} />
            <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Internal staff notes..." rows={3} />
            <Button onClick={() => patch({ notes: { handoff_notes: handoffNotes, internal_notes: internalNotes } }, 'Notes saved', 'notes')} disabled={loadingKey === 'notes'}>
              {loadingKey === 'notes' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
              Save notes
            </Button>
          </TabsContent>}

          {settings.signatures && <TabsContent value="sign" className="mt-0 flex-none space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm font-semibold">Rental agreement</p>
              <p className="mt-1 text-xs text-slate-500">
                Customer accepts item condition, return date, late fees, damage/missing charges, and deposit adjustment rules.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Signature type</Label>
                <Select value={signature.type} onValueChange={(type) => setSignature(prev => ({ ...prev, type }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['rental_agreement', 'pickup', 'return', 'delivery'].map(value => <SelectItem key={value} value={value}>{value.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Signer name</Label>
                <Input value={signature.signer_name} onChange={(e) => setSignature(prev => ({ ...prev, signer_name: e.target.value }))} />
              </div>
            </div>
            <Textarea value={signature.signature_data} onChange={(e) => setSignature(prev => ({ ...prev, signature_data: e.target.value }))} placeholder="Type customer name or paste signature data" rows={2} />
            <Button
              onClick={() => patch({
                signature: {
                  ...signature,
                  agreement_text: 'Customer accepts item condition, return date, late fees, damage/missing charges, and deposit adjustment rules.',
                },
              }, 'Signature saved', 'signature')}
              disabled={loadingKey === 'signature' || !signature.signer_name.trim()}
            >
              {loadingKey === 'signature' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
              Save signature
            </Button>
            <div className="space-y-2">
              {signatures.map((row) => (
                <div key={row.id} className="flex justify-between rounded-lg bg-slate-50 p-2 text-xs">
                  <span className="font-medium capitalize">{row.signature_type.replace(/_/g, ' ')} · {row.signer_name || 'Signer'}</span>
                  <span className="text-slate-500">{new Date(row.captured_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </TabsContent>}
        </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
