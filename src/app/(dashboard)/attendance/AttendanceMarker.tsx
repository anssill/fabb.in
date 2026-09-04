'use client'

import { useState } from 'react'
import { MapPin, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { safeJsonParse } from '@/lib/api-utils'

export function AttendanceMarker({ current }: { current: { attendance_status: string; gps_warning: boolean } | null }) {
  const [submitting, setSubmitting] = useState(false)
  const [record, setRecord] = useState(current)

  function markPresent() {
    if (!navigator.geolocation) {
      toast.error('This device does not support GPS')
      return
    }
    setSubmitting(true)
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        })
        const result = await safeJsonParse(response)
        if (!response.ok && response.status !== 202) throw new Error(result.error || 'Could not record attendance')
        if (response.status === 202) {
          toast.success('Attendance saved offline and will sync automatically')
          setRecord({ attendance_status: 'present', gps_warning: false })
        } else {
          const attendance = Array.isArray(result.attendance) ? result.attendance[0] : result.attendance
          setRecord(attendance)
          toast.success(attendance?.gps_warning ? 'Present recorded with an out-of-radius warning' : 'Present recorded')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not record attendance')
      } finally {
        setSubmitting(false)
      }
    }, () => {
      toast.error('Location permission is required to mark present')
      setSubmitting(false)
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
  }

  if (record?.attendance_status === 'present') {
    return <div className={`flex items-center gap-3 rounded-xl border p-4 ${record.gps_warning ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
      {record.gps_warning ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
      <div><p className="text-sm font-semibold">Present today</p><p className="text-xs text-muted-foreground">{record.gps_warning ? 'Recorded outside the branch radius; the warning is retained for managers.' : 'GPS attendance is recorded.'}</p></div>
    </div>
  }

  return <Button onClick={markPresent} disabled={submitting} className="w-full sm:w-auto">
    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
    Mark present with GPS
  </Button>
}
