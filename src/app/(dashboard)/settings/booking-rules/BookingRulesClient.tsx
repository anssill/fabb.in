'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import type { BranchData } from '@/lib/store'
import { safeJsonParse } from '@/lib/api-utils'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Save } from 'lucide-react'

export function BookingRulesClient({
  initialBranch,
  initialBranches,
}: {
  initialBranch: BranchData | null
  initialBranches: BranchData[]
}) {
  const { activeBranch, setActiveBranch, setBranches, branches } = useAppStore()
  const currentBranch = activeBranch || initialBranch
  const currentBranches = branches.length > 0 ? branches : initialBranches

  const settings = (currentBranch?.settings as any) || {}
  const [isSaving, setIsSaving] = useState(false)

  const [advancePct, setAdvancePct] = useState<number>(settings.min_advance_pct ?? 30)
  const [depositPct, setDepositPct] = useState<number>(settings.deposit_default_pct ?? 20)
  const [bufferDays, setBufferDays] = useState<number>(settings.buffer_days ?? 1)
  const [maxBookingWindow, setMaxBookingWindow] = useState<number>(settings.max_booking_window ?? 180)
  const [minRentalDays, setMinRentalDays] = useState<number>(settings.min_rental_days ?? 1)
  const [allowSameDay, setAllowSameDay] = useState<boolean>(settings.allow_same_day_booking ?? true)
  const [requirePhysicalBill, setRequirePhysicalBill] = useState<boolean>(settings.require_physical_bill_number ?? false)
  const [requireCustomerIdProof, setRequireCustomerIdProof] = useState<boolean>(settings.require_customer_id_proof ?? false)
  const [enforceStockLimit, setEnforceStockLimit] = useState<boolean>(settings.enforce_stock_limit ?? false)

  useEffect(() => {
    if (initialBranches.length > 0 && branches.length === 0) {
      setBranches(initialBranches)
    }
    if (initialBranch && !activeBranch) {
      setActiveBranch(initialBranch)
    }
  }, [activeBranch, branches.length, initialBranch, initialBranches, setActiveBranch, setBranches])

  useEffect(() => {
    const nextSettings = (currentBranch?.settings as any) || {}
    setAdvancePct(nextSettings.min_advance_pct ?? 30)
    setDepositPct(nextSettings.deposit_default_pct ?? 20)
    setBufferDays(nextSettings.buffer_days ?? 1)
    setMaxBookingWindow(nextSettings.max_booking_window ?? 180)
    setMinRentalDays(nextSettings.min_rental_days ?? 1)
    setAllowSameDay(nextSettings.allow_same_day_booking ?? true)
    setRequirePhysicalBill(nextSettings.require_physical_bill_number ?? false)
    setRequireCustomerIdProof(nextSettings.require_customer_id_proof ?? false)
    setEnforceStockLimit(nextSettings.enforce_stock_limit ?? false)
  }, [currentBranch])

  async function handleSave() {
    if (!currentBranch) return
    setIsSaving(true)
    try {
      const newSettings = {
        ...settings,
        min_advance_pct: advancePct,
        deposit_default_pct: depositPct,
        buffer_days: bufferDays,
        max_booking_window: maxBookingWindow,
        min_rental_days: minRentalDays,
        allow_same_day_booking: allowSameDay,
        require_physical_bill_number: requirePhysicalBill,
        require_customer_id_proof: requireCustomerIdProof,
        enforce_stock_limit: enforceStockLimit,
      }
      const res = await fetch('/api/settings/branch-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: currentBranch.id, settings: newSettings }),
      })
      const result = await safeJsonParse(res)
      if (!res.ok) throw new Error(result.error || 'Failed to save booking rules')

      const updatedBranch = result.branch || { ...currentBranch, settings: newSettings }
      setBranches(currentBranches.map(b => b.id === currentBranch.id ? updatedBranch : b))
      setActiveBranch(updatedBranch)
      toast.success('Booking rules updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save booking rules')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Payment Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Minimum Advance Payment</Label>
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{advancePct}%</span>
            </div>
            <Slider
              value={[advancePct]}
              onValueChange={([v]) => setAdvancePct(v)}
              min={0} max={100} step={5}
              className="w-full"
            />
            <p className="text-xs text-slate-400">Minimum percentage of total amount collected at booking time.</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Default Deposit Percentage</Label>
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{depositPct}%</span>
            </div>
            <Slider
              value={[depositPct]}
              onValueChange={([v]) => setDepositPct(v)}
              min={0} max={50} step={5}
              className="w-full"
            />
            <p className="text-xs text-slate-400">Security deposit collected at pickup, returned when items come back undamaged.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Date & Scheduling Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buffer Days Between Bookings</Label>
              <Input
                type="number"
                min={0} max={7}
                value={bufferDays}
                onChange={e => setBufferDays(Number(e.target.value))}
              />
              <p className="text-xs text-slate-400">Days blocked after return for washing.</p>
            </div>

            <div className="space-y-2">
              <Label>Max Advance Booking (days)</Label>
              <Input
                type="number"
                min={7} max={730}
                value={maxBookingWindow}
                onChange={e => setMaxBookingWindow(Number(e.target.value))}
              />
              <p className="text-xs text-slate-400">How far in advance can bookings be made.</p>
            </div>

            <div className="space-y-2">
              <Label>Minimum Rental Days</Label>
              <Input
                type="number"
                min={1} max={30}
                value={minRentalDays}
                onChange={e => setMinRentalDays(Number(e.target.value))}
              />
              <p className="text-xs text-slate-400">Minimum rental duration per booking.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Validation Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <RuleSwitch
            label="Allow same-day bookings"
            description="When disabled, pickup date must be at least tomorrow."
            checked={allowSameDay}
            onCheckedChange={setAllowSameDay}
          />
          <Separator />
          <RuleSwitch
            label="Require physical bill number"
            description="Payment step cannot finish until a bill book number is entered."
            checked={requirePhysicalBill}
            onCheckedChange={setRequirePhysicalBill}
          />
          <Separator />
          <RuleSwitch
            label="Require customer ID proof"
            description="New bookings require an uploaded or existing ID proof."
            checked={requireCustomerIdProof}
            onCheckedChange={setRequireCustomerIdProof}
          />
          <Separator />
          <RuleSwitch
            label="Block overbooking"
            description="Selected item quantity cannot exceed available stock for the chosen dates."
            checked={enforceStockLimit}
            onCheckedChange={setEnforceStockLimit}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save booking rules</>}
        </Button>
      </div>
    </div>
  )
}

function RuleSwitch({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
