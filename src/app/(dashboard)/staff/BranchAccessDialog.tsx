'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Branch = { id: string; name: string }
export function BranchAccessDialog({ staffId, onClose }: { staffId: string | null; onClose: () => void }) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [home, setHome] = useState('')
  const [switching, setSwitching] = useState(false)
  const [allowed, setAllowed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!staffId) return
    let cancelled = false
    setLoading(true); setError('')
    const db = createClient() as any
    Promise.all([
      db.from('branches').select('id,name').eq('status', 'active').order('name'),
      db.from('staff').select('home_branch_id,branch_id,permissions').eq('id', staffId).single(),
      db.from('staff_branch_memberships').select('branch_id').eq('staff_id', staffId),
    ]).then(([branchResult, staffResult, membershipResult]) => {
      if (cancelled) return
      const failure = branchResult.error || staffResult.error || membershipResult.error
      if (failure) { setError(failure.message); return }
      setBranches(branchResult.data || [])
      setHome(staffResult.data.home_branch_id || staffResult.data.branch_id || '')
      setSwitching(staffResult.data.permissions?.switch_branches === true)
      setAllowed((membershipResult.data || []).map((row: { branch_id: string }) => row.branch_id))
    }).catch(() => { if (!cancelled) setError('Could not load branch access. Close and try again.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [staffId])
  async function save() {
    setSaving(true)
    try {
      const { error: failure } = await (createClient() as any).rpc('set_staff_branch_access', {
        p_staff_id: staffId, p_home: home, p_switch: switching, p_branches: switching ? allowed : [],
      })
      if (failure) throw failure
      toast.success('Branch access saved'); onClose()
    } catch (failure: any) { setError(failure.message || 'Could not save branch access') }
    finally { setSaving(false) }
  }
  return <Dialog open={!!staffId} onOpenChange={open => { if (!open && !saving) onClose() }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>Staff branch access</DialogTitle><DialogDescription>Choose a permanent home branch and the additional branches this staff member can select.</DialogDescription></DialogHeader>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loading ? <p role="status">Loading branch access…</p> : <div className="space-y-5">
        <label className="block space-y-2 text-sm font-medium">Home branch
          <select className="block w-full rounded-xl border p-3" value={home} onChange={event => setHome(event.target.value)}>
            <option value="">Choose a branch</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={switching} onChange={event => setSwitching(event.target.checked)} />Allow branch switching</label>
        {switching && <fieldset className="space-y-3 rounded-xl border p-4"><legend className="px-2 text-sm font-medium">Allowed branches</legend>{branches.map(branch => <label key={branch.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={branch.id === home || allowed.includes(branch.id)} disabled={branch.id === home} onChange={event => setAllowed(previous => event.target.checked ? [...previous, branch.id] : previous.filter(id => id !== branch.id))} />{branch.name}{branch.id === home ? ' (home)' : ''}</label>)}</fieldset>}
        <p className="text-xs text-slate-500">Feature permissions still apply in every branch. Removing access also stops its notifications.</p>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving || !home || !!error && branches.length === 0}>{saving ? 'Saving…' : 'Save access'}</Button></div>
      </div>}
    </DialogContent>
  </Dialog>
}
