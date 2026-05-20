'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, LogOut, Loader2 } from 'lucide-react'
import { clockIn, clockOut, getTodayAttendance } from '../../staff/attendance-actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function AttendanceWidget() {
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Update live clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [])

  async function fetchAttendance() {
    try {
      const data = await getTodayAttendance()
      setRecord(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleClockIn() {
    setActionLoading(true)

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      setActionLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          await clockIn(lat, lng)
          toast.success('Clocked in successfully!')
          await fetchAttendance()
        } catch (error: any) {
          toast.error(error.message || 'Failed to clock in')
        } finally {
          setActionLoading(false)
        }
      },
      (error) => {
        console.error(error)
        let errMsg = 'Could not access your location. Please grant location permissions.'
        if (error.code === error.PERMISSION_DENIED) errMsg = 'Location access denied. GPS is required for clock-in.'
        toast.error(errMsg)
        setActionLoading(false)
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    )
  }

  async function handleClockOut() {
    setActionLoading(true)
    try {
      await clockOut()
      toast.success('Clocked out successfully!')
      await fetchAttendance()
    } catch (error: any) {
      toast.error(error.message || 'Failed to clock out')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="h-full bg-card border-border">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const isClockedIn = record && record.clock_in_at && !record.clock_out_at
  const isClockedOut = record && record.clock_out_at

  return (
    <Card className="bg-card text-card-foreground border border-border shadow-sm relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground">Time & Attendance</h2>
            <div className="text-3xl font-bold mt-1 tracking-tight text-foreground">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          {record?.is_valid_location === false && (
             <Badge variant="destructive" className="border-none">
              Invalid GPS
            </Badge>
          )}
        </div>

        <div className="space-y-4 relative z-10">
          {(!record || (!isClockedIn && !isClockedOut)) && (
            <Button 
              onClick={handleClockIn} 
              disabled={actionLoading}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
              Clock In (GPS)
            </Button>
          )}

          {isClockedIn && (
            <div className="space-y-3">
              <div className="flex items-center text-sm bg-muted border border-border rounded-lg p-3 text-muted-foreground">
                <Clock className="w-4 h-4 mr-2 text-primary" />
                <span>Clocked in at {new Date(record.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <Button 
                onClick={handleClockOut} 
                disabled={actionLoading}
                variant="destructive"
                className="w-full font-semibold"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                Clock Out
              </Button>
            </div>
          )}

          {isClockedOut && (
            <div className="flex space-x-2">
               <div className="flex-1 flex flex-col items-center justify-center bg-muted border border-border rounded-lg p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Shift Ended</span>
                  <span className="font-semibold mt-1 text-foreground">{new Date(record.clock_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
               <div className="flex-1 flex flex-col items-center justify-center bg-muted border border-border rounded-lg p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Hours</span>
                  <span className="font-semibold mt-1 text-foreground">{record.hours_worked}</span>
               </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
