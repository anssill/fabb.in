'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Navigation, CheckCircle2, Loader2, LogOut } from 'lucide-react'
import { ClockInModal } from './ClockInModal'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

export function AttendanceWidget() {
  const [attendance, setAttendance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const { staff } = useAppStore()
  const supabase = createClient()

  const fetchAttendance = async () => {
    if (!staff) return
    const today = new Date().toISOString().split('T')[0]
    
    const { data } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('staff_id', staff.id)
      .eq('date', today)
      .is('clock_out_at', null)
      .single()

    setAttendance(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchAttendance()
  }, [staff])

  const handleClockOut = async () => {
    if (!attendance) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('staff_attendance')
        .update({
          clock_out_at: new Date().toISOString(),
          hours_worked: (new Date().getTime() - new Date(attendance.clock_in_at).getTime()) / (1000 * 60 * 60)
        })
        .eq('id', attendance.id)

      if (error) throw error

      toast.success('Successfully clocked out. Great job today!')
      setAttendance(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to clock out.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 flex items-center justify-center h-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  )

  return (
    <>
      <Card className={`border border-border shadow-sm transition-all duration-300 ${attendance ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-card text-card-foreground'}`}>
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${attendance ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {attendance ? 'You are On Duty' : 'Shift Not Started'}
              </p>
              <p className="text-xs text-muted-foreground">
                {attendance ? `Clocked in at ${new Date(attendance.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Ready to start today?'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {attendance ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 border-emerald-500/20 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                onClick={handleClockOut}
                disabled={loading}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Clock Out
              </Button>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/95 text-primary-foreground h-9" 
                onClick={() => setModalOpen(true)}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Clock In
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ClockInModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={fetchAttendance}
      />
    </>
  )
}
