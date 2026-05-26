'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/lib/store'
import type { BranchData } from '@/lib/store'
import { safeJsonParse } from '@/lib/api-utils'
import { DEFAULT_OPERATION_SETTINGS, getOperationSettings, type OperationSettings } from '@/lib/operation-settings'
import { Save, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

type ToggleKey = keyof OperationSettings

const MODULE_TOGGLES: Array<{ key: ToggleKey; label: string; description: string }> = [
  { key: 'showInSidebar', label: 'Show Operations in sidebar', description: 'Adds the Shop Floor Operations screen to the main menu.' },
  { key: 'bookingWorkspace', label: 'Booking operations workspace', description: 'Shows the Operations tab inside booking details.' },
  { key: 'checklist', label: 'Booking checklist', description: 'Customer, payment, prep, pickup, return, washing, and invoice checklist.' },
  { key: 'itemPrep', label: 'Item prep controls', description: 'Prep status, bag/hanger code, accessories, and condition-before-pickup fields.' },
  { key: 'tasks', label: 'Staff task system', description: 'Auto-created task cards and task status controls.' },
  { key: 'fittingAlterations', label: 'Fitting and alterations', description: 'Fitting status and tailor/alteration workflow controls.' },
  { key: 'delivery', label: 'Delivery workflow', description: 'Delivery mode, address, fee, status, and staff handoff controls.' },
  { key: 'signatures', label: 'Customer signatures', description: 'Pickup, return, delivery, and rental agreement signature capture.' },
  { key: 'staffNotes', label: 'Handoff and internal notes', description: 'Notes for shift handoff and manager-only context.' },
  { key: 'whatsappActions', label: 'WhatsApp quick actions', description: 'Preview/send operational messages from workflow states.' },
  { key: 'draftList', label: 'Booking draft list', description: 'Shows saved booking drafts under Bookings.' },
]

export function OperationsSettingsClient({
  initialBranch,
  initialBranches,
}: {
  initialBranch: BranchData | null
  initialBranches: BranchData[]
}) {
  const { activeBranch, setActiveBranch, setBranches, branches } = useAppStore()
  const currentBranch = activeBranch || initialBranch
  const currentBranches = branches.length > 0 ? branches : initialBranches
  const [settings, setSettings] = useState<OperationSettings>(() => getOperationSettings(currentBranch?.settings))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initialBranches.length > 0 && branches.length === 0) setBranches(initialBranches)
    if (initialBranch && !activeBranch) setActiveBranch(initialBranch)
  }, [activeBranch, branches.length, initialBranch, initialBranches, setActiveBranch, setBranches])

  useEffect(() => {
    setSettings(getOperationSettings(currentBranch?.settings))
  }, [currentBranch])

  function setToggle(key: ToggleKey, checked: boolean) {
    setSettings(prev => ({ ...prev, [key]: checked }))
  }

  async function handleSave() {
    if (!currentBranch) return
    setIsSaving(true)
    try {
      const branchSettings = (currentBranch.settings as Record<string, unknown> | null) || {}
      const nextBranchSettings = {
        ...branchSettings,
        operations: settings,
      }
      const res = await fetch('/api/settings/branch-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: currentBranch.id, settings: nextBranchSettings }),
      })
      const result = await safeJsonParse(res)
      if (!res.ok) throw new Error(result.error || 'Failed to save operations settings')

      const updatedBranch = result.branch || { ...currentBranch, settings: nextBranchSettings }
      setBranches(currentBranches.map(branch => branch.id === currentBranch.id ? updatedBranch : branch))
      setActiveBranch(updatedBranch)
      toast.success('Operations settings updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save operations settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Settings2 className="h-5 w-5 text-[#4f46e5]" />
            Operations Master Switch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingSwitch
            label="Enable store operations"
            description="Turns on shop-floor workflows across booking detail, operations mode, tasks, delivery, and signatures."
            checked={settings.enabled}
            onCheckedChange={(checked) => setToggle('enabled', checked)}
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Workflow Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {MODULE_TOGGLES.map((toggle, index) => (
            <div key={toggle.key}>
              <SettingSwitch
                label={toggle.label}
                description={toggle.description}
                checked={Boolean(settings[toggle.key])}
                disabled={!settings.enabled && toggle.key !== 'showInSidebar'}
                onCheckedChange={(checked) => setToggle(toggle.key, checked)}
              />
              {index < MODULE_TOGGLES.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setSettings(DEFAULT_OPERATION_SETTINGS)}
          disabled={isSaving}
        >
          Reset defaults
        </Button>
        <Button className="bg-[#4f46e5] text-white hover:bg-[#4338ca]" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" />Save operations settings</>}
        </Button>
      </div>
    </div>
  )
}

function SettingSwitch({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label className="text-sm font-medium text-slate-900">{label}</Label>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  )
}
