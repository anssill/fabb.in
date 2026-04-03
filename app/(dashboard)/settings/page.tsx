'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useUserStore } from '@/lib/stores/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { writeAuditLog } from '@/lib/audit'
import type { Branch, BranchSettings, Staff } from '@/lib/types/echo'
import {
  Store,
  Printer,
  Shield,
  Box,
  Calendar,
  Save,
  Check,
  X,
  UserPlus,
} from 'lucide-react'
import { formatINR } from '@/lib/format'

// ─── Receipt preview ─────────────────────────────────────────────────────────

function ReceiptPreview({ settings }: { settings: BranchSettings }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-zinc-200 p-4 font-mono text-xs leading-relaxed text-zinc-800 max-w-[250px] mx-auto shadow-sm">
      {/* 68mm = ~250px at 96dpi */}
      <div className="text-center space-y-0.5">
        {settings.receipt_show_logo && (
          <div className="text-lg font-bold">[LOGO]</div>
        )}
        <div className="font-bold" style={{ fontSize: settings.receipt_font_size || 12 }}>
          {settings.receipt_header || 'STORE NAME'}
        </div>
        <div className="text-zinc-500">123 Store Address, City</div>
        <div className="text-zinc-500">Ph: +91 98765 43210</div>
      </div>
      <div className="border-t border-dashed border-zinc-300 my-2" />
      <div className="flex justify-between">
        <span>Booking:</span>
        <span className="font-bold">TRT-260401-001</span>
      </div>
      <div className="flex justify-between">
        <span>Date:</span>
        <span>01 Apr 2026</span>
      </div>
      <div className="flex justify-between">
        <span>Customer:</span>
        <span>Priya Sharma</span>
      </div>
      <div className="border-t border-dashed border-zinc-300 my-2" />
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Lehenga (M) x1</span>
          <span>{formatINR(2500)}</span>
        </div>
        <div className="flex justify-between">
          <span>Dupatta x1</span>
          <span>{formatINR(500)}</span>
        </div>
      </div>
      <div className="border-t border-dashed border-zinc-300 my-2" />
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>{formatINR(3000)}</span>
      </div>
      <div className="flex justify-between text-zinc-500">
        <span>Advance:</span>
        <span>{formatINR(1500)}</span>
      </div>
      <div className="flex justify-between text-zinc-500">
        <span>Deposit (Refundable):</span>
        <span>{formatINR(1000)}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>Balance Due:</span>
        <span>{formatINR(1500)}</span>
      </div>
      <div className="border-t border-dashed border-zinc-300 my-2" />
      <div className="text-center">
        <div className="inline-block border border-zinc-400 px-6 py-3 my-1 text-xs">
          [QR CODE]
        </div>
      </div>
      <div className="text-center text-zinc-500 mt-1">
        Pickup: 05 Apr 2026 · Return: 08 Apr 2026
      </div>
      <div className="border-t border-dashed border-zinc-300 my-2" />
      <div className="text-center text-zinc-400 italic" style={{ fontSize: Math.max((settings.receipt_font_size || 12) - 2, 8) }}>
        {settings.receipt_footer || 'Thank you for choosing our store!'}
      </div>
    </div>
  )
}

// ─── Staff approval row ──────────────────────────────────────────────────────

function StaffRow({
  member,
  canManage,
  onApprove,
  onReject,
}: {
  member: Staff
  canManage: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const roleColour: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    floor_staff: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    auditor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    custom: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  }
  const statusColour: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    rejected: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-[#ccff00] flex items-center justify-center text-black font-bold text-xs shrink-0">
          {(member.name || 'U')
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
            {member.name || 'Unnamed'}
          </p>
          <p className="text-xs text-zinc-500 truncate">{member.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={`text-xs font-medium ${roleColour[member.role] || ''}`}>
          {member.role.replace('_', ' ')}
        </Badge>
        <Badge className={`text-xs font-medium ${statusColour[member.status] || ''}`}>
          {member.status}
        </Badge>
        {canManage && member.status === 'pending' && (
          <div className="flex gap-1.5 ml-2">
            <Button
              size="sm"
              className="h-7 text-xs bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold"
              onClick={() => onApprove(member.id)}
            >
              <Check className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-zinc-200 dark:border-zinc-700"
              onClick={() => onReject(member.id)}
            >
              <X className="w-3 h-3 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Settings Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const profile = useUserStore((s) => s.profile)
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const supabase = createClient()

  const isManager = profile?.role === 'manager' || profile?.role === 'super_admin'
  const isSuperAdmin = profile?.role === 'super_admin'

  // ── Branch state ────────
  const [branch, setBranch] = useState<Branch | null>(null)
  const [settings, setSettings] = useState<BranchSettings>({})
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchData = useCallback(async () => {
    if (!activeBranchId) return
    setLoading(true)

    const [branchRes, staffRes] = await Promise.all([
      supabase.from('branches').select('*').eq('id', activeBranchId).single(),
      supabase.from('staff').select('*').eq('branch_id', activeBranchId).order('created_at', { ascending: false }),
    ])

    if (branchRes.data) {
      const b = branchRes.data as Branch
      setBranch(b)
      setSettings((b.settings || {}) as BranchSettings)
    }
    if (staffRes.data) setStaffList(staffRes.data as Staff[])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    if (!branch || !activeBranchId) return
    setSaving(true)
    const { error } = await supabase
      .from('branches')
      .update({ settings })
      .eq('id', activeBranchId)
    if (!error) {
      await writeAuditLog({
        action: 'update_branch_settings',
        tableName: 'branches',
        recordId: activeBranchId,
        newValue: settings as Record<string, unknown>,
        branchId: activeBranchId,
        businessId: branch.business_id,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handleSaveBranch = async (updates: Partial<Branch>) => {
    if (!activeBranchId || !branch) return
    setSaving(true)
    const { error } = await supabase.from('branches').update(updates).eq('id', activeBranchId)
    if (!error) {
      setBranch({ ...branch, ...updates })
      await writeAuditLog({
        action: 'update_branch_info',
        tableName: 'branches',
        recordId: activeBranchId,
        newValue: updates as Record<string, unknown>,
        branchId: activeBranchId,
        businessId: branch.business_id,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handleStaffAction = async (staffId: string, status: 'approved' | 'rejected') => {
    await supabase.from('staff').update({ status }).eq('id', staffId)
    await writeAuditLog({
      action: `staff_${status}`,
      tableName: 'staff',
      recordId: staffId,
      newValue: { status },
      branchId: activeBranchId,
      businessId: branch?.business_id,
    })
    fetchData()
  }

  const updateSetting = <K extends keyof BranchSettings>(key: K, val: BranchSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }))
  }

  // ── Determine visible tabs ──
  const tabs = [
    { id: 'branch', label: 'Branch', icon: <Store className="w-4 h-4" /> },
    { id: 'print', label: 'Print & Receipt', icon: <Printer className="w-4 h-4" /> },
    ...(isManager
      ? [{ id: 'roles', label: 'Roles & Staff', icon: <Shield className="w-4 h-4" /> }]
      : []),
    { id: 'inventory', label: 'Inventory', icon: <Box className="w-4 h-4" /> },
    { id: 'booking', label: 'Bookings', icon: <Calendar className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage branch, print, roles, and module settings.</p>
      </div>

      <Tabs defaultValue="branch" className="flex flex-col md:flex-row gap-6">
        {/* Tab list — sidebar on desktop */}
        <TabsList className="flex md:flex-col md:w-56 h-auto bg-transparent p-0 gap-0.5 shrink-0">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="justify-start gap-2 w-full px-4 py-2.5 text-sm font-medium rounded-lg text-zinc-500 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* ── Branch settings ───── */}
          <TabsContent value="branch" className="mt-0 space-y-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Branch Information</CardTitle>
                <CardDescription>Core details for this branch.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Store Name</Label>
                        <Input
                          defaultValue={branch?.name || ''}
                          onBlur={(e) => handleSaveBranch({ name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>GST Number</Label>
                        <Input
                          defaultValue={branch?.gst_number || ''}
                          placeholder="22AAAAA0000A1Z5"
                          onBlur={(e) => handleSaveBranch({ gst_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Address</Label>
                        <Textarea
                          rows={2}
                          defaultValue={branch?.address || ''}
                          onBlur={(e) => handleSaveBranch({ address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Phone</Label>
                        <Input
                          defaultValue={branch?.contact || ''}
                          placeholder="+91 98765 43210"
                          onBlur={(e) => handleSaveBranch({ contact: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Print settings with 68mm preview ───── */}
          <TabsContent value="print" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Config */}
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Receipt Configuration</CardTitle>
                  <CardDescription>
                    Vyapar VYPRTP3001 · 68mm (3-inch) thermal printer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Receipt Header (Store Name)</Label>
                        <Input
                          value={settings.receipt_header ?? ''}
                          onChange={(e) => updateSetting('receipt_header', e.target.value)}
                          placeholder="ECHO RENTALS"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Receipt Footer</Label>
                        <Textarea
                          rows={2}
                          value={settings.receipt_footer ?? ''}
                          onChange={(e) => updateSetting('receipt_footer', e.target.value)}
                          placeholder="Thank you! Items must be returned on time."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Font Size (px)</Label>
                        <Input
                          type="number"
                          min={8}
                          max={18}
                          value={settings.receipt_font_size ?? 12}
                          onChange={(e) =>
                            updateSetting('receipt_font_size', Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Show Logo on Receipt</Label>
                          <p className="text-xs text-zinc-500">
                            Prints the branch logo at the top.
                          </p>
                        </div>
                        <Switch
                          checked={settings.receipt_show_logo ?? false}
                          onCheckedChange={(v) => updateSetting('receipt_show_logo', v)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Live preview */}
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Receipt Preview</CardTitle>
                  <CardDescription>
                    68mm thermal — live preview updates as you type
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-start justify-center py-4">
                  <ReceiptPreview settings={settings} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Roles & Staff ───── */}
          {isManager && (
            <TabsContent value="roles" className="mt-0 space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Staff Members</CardTitle>
                      <CardDescription>
                        Manage team members and approve new staff logins.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs border-zinc-200 dark:border-zinc-700">
                      {staffList.length} members
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : staffList.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                      <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No staff in this branch yet.</p>
                      <p className="text-xs mt-1">Staff will appear here after signing in with Google.</p>
                    </div>
                  ) : (
                    <>
                      {/* Pending first */}
                      {staffList
                        .sort((a, b) => {
                          if (a.status === 'pending' && b.status !== 'pending') return -1
                          if (a.status !== 'pending' && b.status === 'pending') return 1
                          return 0
                        })
                        .map((m) => (
                          <StaffRow
                            key={m.id}
                            member={m}
                            canManage={isManager}
                            onApprove={(id) => handleStaffAction(id, 'approved')}
                            onReject={(id) => handleStaffAction(id, 'rejected')}
                          />
                        ))}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Role permissions reference */}
              {isSuperAdmin && (
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Role Permissions</CardTitle>
                    <CardDescription>
                      Reference for built-in roles. Custom roles coming soon.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left">
                            <th className="pb-2 text-xs font-semibold text-zinc-500 uppercase">Permission</th>
                            <th className="pb-2 text-xs font-semibold text-zinc-500 uppercase text-center">Super Admin</th>
                            <th className="pb-2 text-xs font-semibold text-zinc-500 uppercase text-center">Manager</th>
                            <th className="pb-2 text-xs font-semibold text-zinc-500 uppercase text-center">Floor Staff</th>
                            <th className="pb-2 text-xs font-semibold text-zinc-500 uppercase text-center">Auditor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {[
                            ['Bookings', true, true, true, false],
                            ['Inventory', true, true, true, false],
                            ['Customers', true, true, true, false],
                            ['Washing', true, true, true, false],
                            ['Payments', true, true, true, false],
                            ['Analytics', true, true, false, false],
                            ['Staff management', true, true, false, false],
                            ['Audit trail', true, false, false, true],
                            ['Franchise', true, false, false, false],
                            ['Settings', true, true, false, false],
                          ].map(([label, sa, mgr, fs, aud], i) => (
                            <tr key={i}>
                              <td className="py-2 text-zinc-700 dark:text-zinc-300">{label as string}</td>
                              {[sa, mgr, fs, aud].map((v, j) => (
                                <td key={j} className="py-2 text-center">
                                  {v ? (
                                    <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                  ) : (
                                    <X className="w-4 h-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* ── Inventory settings ───── */}
          <TabsContent value="inventory" className="mt-0 space-y-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Inventory Configuration</CardTitle>
                <CardDescription>
                  SKU format, stock thresholds, and depreciation rules.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>SKU Prefix</Label>
                        <Input
                          value={settings.sku_prefix ?? ''}
                          onChange={(e) => updateSetting('sku_prefix', e.target.value)}
                          placeholder="TRT"
                        />
                        <p className="text-xs text-zinc-500">
                          Items will be numbered as PREFIX-001, PREFIX-002, etc.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Low Stock Alert Threshold</Label>
                        <Input
                          type="number"
                          min={0}
                          value={settings.low_stock_threshold ?? 3}
                          onChange={(e) =>
                            updateSetting('low_stock_threshold', Number(e.target.value))
                          }
                        />
                        <p className="text-xs text-zinc-500">
                          Alert when available count drops below this.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Annual Depreciation %</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={settings.depreciation_pct ?? 15}
                          onChange={(e) =>
                            updateSetting('depreciation_pct', Number(e.target.value))
                          }
                        />
                        <p className="text-xs text-zinc-500">
                          Used for book value calculation per item.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Booking settings ───── */}
          <TabsContent value="booking" className="mt-0 space-y-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Booking Rules</CardTitle>
                <CardDescription>
                  Advance requirements, buffer days, and washing settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Advance %</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={settings.min_advance_pct ?? 30}
                          onChange={(e) =>
                            updateSetting('min_advance_pct', Number(e.target.value))
                          }
                        />
                        <p className="text-xs text-zinc-500">
                          % of total amount required as advance payment.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Buffer Days Between Bookings</Label>
                        <Input
                          type="number"
                          min={0}
                          max={14}
                          value={settings.buffer_days ?? 1}
                          onChange={(e) =>
                            updateSetting('buffer_days', Number(e.target.value))
                          }
                        />
                        <p className="text-xs text-zinc-500">
                          Days reserved after return for washing before next booking.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Advance Booking Window (days)</Label>
                        <Input
                          type="number"
                          min={7}
                          max={365}
                          value={settings.advance_booking_days ?? 180}
                          onChange={(e) =>
                            updateSetting('advance_booking_days', Number(e.target.value))
                          }
                        />
                        <p className="text-xs text-zinc-500">
                          How far ahead a customer can book.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Auto-Add to Washing on Return</Label>
                        <p className="text-xs text-zinc-500">
                          Automatically add items to washing queue when marked as returned.
                        </p>
                      </div>
                      <Switch
                        checked={settings.auto_add_to_washing ?? false}
                        onCheckedChange={(v) => updateSetting('auto_add_to_washing', v)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* SLA by category */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Washing SLA by Category</CardTitle>
                <CardDescription>
                  Hours allowed for washing turnaround per item category.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['Lehenga', 'Saree', 'Sherwani', 'Kurtha', 'Gown', 'Suit'].map(
                      (cat) => (
                        <div key={cat} className="flex items-center gap-3">
                          <Label className="w-24 text-sm">{cat}</Label>
                          <Input
                            type="number"
                            min={1}
                            max={168}
                            className="w-24"
                            value={
                              settings.sla_hours_by_category?.[cat.toLowerCase()] ?? 24
                            }
                            onChange={(e) =>
                              updateSetting('sla_hours_by_category', {
                                ...settings.sla_hours_by_category,
                                [cat.toLowerCase()]: Number(e.target.value),
                              })
                            }
                          />
                          <span className="text-xs text-zinc-500">hours</span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Save button ───── */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#ccff00] text-black hover:bg-[#bce600] font-semibold px-6"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : saving ? (
                'Saving…'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
