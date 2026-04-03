'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/useUserStore'
import { writeAuditLog } from '@/lib/audit'
import { CheckSquare } from 'lucide-react'

const DEFAULT_ITEMS = [
  'Count and verify cash in drawer',
  'Check overnight washing queue for urgent items',
  'Review today\'s bookings (pickups + returns)',
  'Ensure items from yesterday\'s returns are in washing',
  'Check for any overdue bookings',
  'Confirm staff on duty today',
]

interface Props {
  open: boolean
  onComplete: () => void
}

export function OpeningChecklistModal({ open, onComplete }: Props) {
  const profile = useUserStore((s) => s.profile)
  const activeBranchId = useUserStore((s) => s.activeBranchId)
  const [checked, setChecked] = useState<boolean[]>(DEFAULT_ITEMS.map(() => false))
  const [saving, setSaving] = useState(false)

  const allDone = checked.every(Boolean)
  const doneCount = checked.filter(Boolean).length

  const toggle = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  const handleComplete = async () => {
    if (!profile?.id || !activeBranchId) return
    setSaving(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const items = DEFAULT_ITEMS.map((label, i) => ({ label, done: checked[i] }))

    await supabase.from('opening_checklists').upsert({
      branch_id: activeBranchId,
      staff_id: profile.id,
      date: today,
      completed_at: new Date().toISOString(),
      items,
    })

    await writeAuditLog({
      action: 'opening_checklist_completed',
      tableName: 'opening_checklists',
      newValue: { items, date: today },
      branchId: activeBranchId,
      businessId: profile.business_id,
    })

    setSaving(false)
    onComplete()
  }

  const handleSkip = () => onComplete()

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onComplete() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#ccff00] flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-black" />
            </div>
            <DialogTitle className="text-lg font-bold">Opening Checklist</DialogTitle>
          </div>
          <p className="text-sm text-zinc-500">
            Complete before starting your shift. {doneCount}/{DEFAULT_ITEMS.length} done.
          </p>
        </DialogHeader>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#ccff00] rounded-full transition-all duration-300"
            style={{ width: `${(doneCount / DEFAULT_ITEMS.length) * 100}%` }}
          />
        </div>

        {/* Items */}
        <div className="space-y-3 mt-2">
          {DEFAULT_ITEMS.map((label, i) => (
            <label
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                checked[i]
                  ? 'bg-[#ccff00]/10 border border-[#ccff00]/40'
                  : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Checkbox
                checked={checked[i]}
                onCheckedChange={() => toggle(i)}
                className="mt-0.5 data-[state=checked]:bg-[#ccff00] data-[state=checked]:border-[#ccff00]"
              />
              <span
                className={`text-sm leading-snug ${
                  checked[i]
                    ? 'line-through text-zinc-400'
                    : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {label}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="flex-1 text-zinc-500 hover:text-zinc-700"
          >
            Skip for now
          </Button>
          <Button
            onClick={handleComplete}
            disabled={saving}
            className={`flex-1 font-semibold ${
              allDone
                ? 'bg-[#ccff00] text-black hover:bg-[#bce600]'
                : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            }`}
          >
            {saving ? 'Saving…' : allDone ? '✓ Complete' : 'Submit anyway'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
