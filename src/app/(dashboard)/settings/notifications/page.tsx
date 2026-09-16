'use client'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PushOptIn } from '@/components/notifications/PushOptIn'
import { DEFAULT_REMINDERS, PUSH_EVENTS } from '@/lib/push/shared'
import { toast } from 'sonner'

export default function PushSettings() {
  const { activeBranch, business, setActiveBranch } = useAppStore()
  const [enabled, setEnabled] = useState(true)
  const [events, setEvents] = useState<Record<string, boolean>>({})
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    const settings = activeBranch?.settings?.push
    setEnabled(settings?.enabled !== false); setEvents(settings?.events || {})
    setReminders(settings?.reminders || DEFAULT_REMINDERS)
  }, [activeBranch])
  async function save() {
    if (!activeBranch) return
    setSaving(true)
    try {
      const push = { enabled, events, reminders }
      const { error } = await (createClient() as any).rpc('save_push_settings', { p_branch: activeBranch.id, p_settings: push })
      if (error) throw error
      setActiveBranch({ ...activeBranch, settings: { ...activeBranch.settings, push } })
      toast.success('Notification settings saved')
    } catch (error: any) { toast.error(error.message || 'Could not save settings') }
    finally { setSaving(false) }
  }
  return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">Push notifications</h1><p className="mt-2 text-sm text-slate-500">Settings for {activeBranch?.name || 'your branch'}. Schedule timezone: {business?.timezone || 'Asia/Kolkata'}.</p></div>
    <PushOptIn />
    <section className="space-y-5 rounded-2xl bg-white p-5"><label className="flex items-center gap-3 font-medium"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />Enable branch alerts</label>
      <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-3 font-medium">Events</legend>{PUSH_EVENTS.map(event => <label key={event} className="flex items-center gap-3 text-sm capitalize"><input type="checkbox" checked={events[event] !== false} onChange={e => setEvents({ ...events, [event]: e.target.checked })} />{event.replaceAll('_', ' ')}</label>)}</fieldset>
      <div className="space-y-4"><h2 className="font-medium">Reminder schedule</h2><p className="text-sm text-slate-500">Pickup and return reminders default to 6 PM the previous day. Overdue reminders run daily until the items are received. Updates replace pending reminders.</p>
        {reminders.map((rule, index) => <div key={index} className="grid items-end gap-3 rounded-xl border p-3 sm:grid-cols-3"><label className="text-sm">Event<select className="mt-2 block w-full rounded-lg border p-2" value={rule.event} onChange={e => setReminders(reminders.map((r, i) => i === index ? { ...r, event: e.target.value, days_before: e.target.value === 'overdue' ? 0 : r.days_before } : r))}><option value="pickup_reminder">Pickup</option><option value="return_reminder">Return</option><option value="overdue">Overdue return</option></select></label><label className="text-sm">Days before<Input type="number" min="0" max="30" disabled={rule.event === 'overdue'} value={rule.event === 'overdue' ? 0 : rule.days_before} onChange={e => setReminders(reminders.map((r, i) => i === index ? { ...r, days_before: Number(e.target.value) } : r))} /></label><label className="text-sm">Time<Input type="time" value={rule.time} onChange={e => setReminders(reminders.map((r, i) => i === index ? { ...r, time: e.target.value } : r))} /></label><Button variant="ghost" onClick={() => setReminders(reminders.filter((_, i) => i !== index))}>Remove reminder</Button></div>)}
        <Button variant="outline" disabled={reminders.length >= 10} onClick={() => setReminders([...reminders, { event: 'return_reminder', days_before: 1, time: '18:00' }])}>Add reminder</Button>
      </div><Button onClick={save} disabled={saving || !activeBranch}>{saving ? 'Saving…' : 'Save settings'}</Button>
    </section></div>
}
