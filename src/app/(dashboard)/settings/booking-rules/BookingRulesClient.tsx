'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export function BookingRulesClient() {
  const { activeBranch, setBranches, branches } = useAppStore()
  const supabase = createClient()

  const settings = (activeBranch?.settings as any) || {}
  const [isSaving, setIsSaving] = useState(false)

  const [advancePct, setAdvancePct] = useState<number>(settings.min_advance_pct ?? 30)
  const [depositPct, setDepositPct] = useState<number>(settings.deposit_default_pct ?? 20)
  const [maxBookingWindow, setMaxBookingWindow] = useState<number>(settings.max_booking_window ?? 180)
  const [minRentalDays, setMinRentalDays] = useState<number>(settings.min_rental_days ?? 1)

  async function handleSave() {
    if (!activeBranch) return
    setIsSaving(true)
    try {
      const newSettings = {
        ...settings,
        min_advance_pct: advancePct,
        deposit_default_pct: depositPct,
        max_booking_window: maxBookingWindow,
        min_rental_days: minRentalDays,
      }
      const { error } = await supabase
        .from('branches')
        .update({ settings: newSettings })
        .eq('id', activeBranch.id)
      if (error) throw error

      setBranches(branches.map(b =>
        b.id === activeBranch.id ? { ...b, settings: newSettings } : b
      ))
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save booking rules</>}
        </Button>
      </div>
    </div>
  )
}
