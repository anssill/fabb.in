'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/lib/store'
import type { BranchData } from '@/lib/store'
import { safeJsonParse } from '@/lib/api-utils'
import { DEFAULT_OPERATION_SETTINGS, getOperationSettings, type OperationSettings } from '@/lib/operation-settings'
import { Power, RotateCcw, Save, Settings2, SlidersHorizontal } from 'lucide-react'
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
  currentUserRole,
}: {
  initialBranch: BranchData | null
  initialBranches: BranchData[]
  currentUserRole: string
}) {
  const { activeBranch, setActiveBranch, setBranches, branches } = useAppStore()
  const currentBranch = activeBranch || initialBranch
  const currentBranches = branches.length > 0 ? branches : initialBranches
  const [settings, setSettings] = useState<OperationSettings>(() => getOperationSettings(currentBranch?.settings))
  const [isSaving, setIsSaving] = useState(false)
  const canEdit = ['owner', 'admin', 'super_admin'].includes(currentUserRole)

  useEffect(() => {
    if (initialBranches.length > 0 && branches.length === 0) setBranches(initialBranches)
    if (initialBranch && !activeBranch) setActiveBranch(initialBranch)
  }, [activeBranch, branches.length, initialBranch, initialBranches, setActiveBranch, setBranches])

  useEffect(() => {
    setSettings(getOperationSettings(currentBranch?.settings))
  }, [currentBranch])

  function setToggle(key: ToggleKey, checked: boolean) {
    if (!canEdit) return
    setSettings(prev => ({ ...prev, [key]: checked }))
  }

  async function handleSave() {
    if (!currentBranch || !canEdit) return
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
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#4f46e5]">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-950">Operations Settings</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${settings.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {settings.enabled ? 'Enabled' : 'Off'}
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-xs text-slate-500">
                  Owners and admins can turn shop-floor workflow sections on or off per branch.
                </p>
                {!canEdit && (
                  <p className="mt-2 text-xs font-medium text-amber-700">Only owners and admins can edit these controls.</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={settings.enabled ? 'secondary' : 'default'} size="sm" onClick={() => setToggle('enabled', !settings.enabled)} disabled={!canEdit || isSaving}>
                <Power className="mr-2 h-4 w-4" />
                {settings.enabled ? 'Turn off' : 'Turn on'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSettings({ ...DEFAULT_OPERATION_SETTINGS, enabled: false })} disabled={!canEdit || isSaving}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Off all
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSettings(DEFAULT_OPERATION_SETTINGS)} disabled={!canEdit || isSaving}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Defaults
              </Button>
              <Button size="sm" className="bg-[#4f46e5] text-white hover:bg-[#4338ca]" onClick={handleSave} disabled={!canEdit || isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Workflow Sections</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 md:col-span-2">
            <SettingSwitch
              label="Enable store operations"
              description="Main switch for operations mode, booking workspace, tasks, delivery, and signatures."
              checked={settings.enabled}
              disabled={!canEdit}
              onCheckedChange={(checked) => setToggle('enabled', checked)}
            />
          </div>
          {MODULE_TOGGLES.map((toggle) => (
            <div key={toggle.key} className="rounded-xl border border-slate-100 bg-white p-3">
              <SettingSwitch
                label={toggle.label}
                description={toggle.description}
                checked={Boolean(settings[toggle.key])}
                disabled={!canEdit || (!settings.enabled && toggle.key !== 'showInSidebar')}
                onCheckedChange={(checked) => setToggle(toggle.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
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
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Label className="text-sm font-medium text-slate-900">{label}</Label>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <Switch className="shrink-0" checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  )
}
