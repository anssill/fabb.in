'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/lib/stores/useUserStore'
import { useAttendance, useClockIn, useClockOut } from '@/lib/queries/useStaff'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MapPin, 
  Clock, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  CalendarDays
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function AttendancePage() {
  const { profile: user, activeBranchId } = useUserStore()
  const { data: attendanceData, isLoading } = useAttendance()
  const clockInMutation = useClockIn()
  const clockOutMutation = useClockOut()

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locError, setLocError] = useState<string | null>(null)

  // Get current session for this user today
  const todaySession = attendanceData?.find(a => a.staff_id === user?.id)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setLocError(err.message)
      )
    } else {
      setLocError('Geolocation not supported')
    }
  }, [])

  const handleClockIn = async () => {
    if (!location) {
      toast.error('Location permission is required to clock in.')
      return
    }

    try {
      await clockInMutation.mutateAsync(location)
      toast.success('Successfully clocked in!')
    } catch (err) {
      toast.error('Failed to clock in.')
    }
  }

  const handleClockOut = async () => {
    if (!todaySession?.id) return

    try {
      await clockOutMutation.mutateAsync(todaySession.id)
      toast.success('Successfully clocked out!')
    } catch (err) {
      toast.error('Failed to clock out.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Attendance & Shift</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Log your daily shift and verify your work location.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="h-1 bg-[#ccff00]" />
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" />
              Current Status
            </CardTitle>
            <CardDescription>{format(new Date(), 'EEEE, MMMM do, yyyy')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
               {todaySession?.clock_in ? (
                 <div className="text-center space-y-4">
                   <div className="flex items-center justify-center gap-3">
                     <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 uppercase text-[10px] font-bold">Currently On-Shift</Badge>
                   </div>
                   <div className="text-5xl font-black text-zinc-900 dark:text-zinc-50">
                     {format(new Date(todaySession.clock_in), 'hh:mm a')}
                   </div>
                   <p className="text-zinc-500 text-sm">Clocked in at your current branch</p>
                   
                   {!todaySession.clock_out ? (
                     <Button 
                       variant="destructive" 
                       size="lg" 
                       className="h-14 px-10 text-lg font-bold rounded-2xl"
                       onClick={handleClockOut}
                       disabled={clockOutMutation.isPending}
                     >
                       {clockOutMutation.isPending ? 'Processing...' : 'Clock Out Now'}
                       <LogOut className="ml-2 w-5 h-5" />
                     </Button>
                   ) : (
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <p className="text-zinc-500 mb-1 italic text-xs">Day ended at</p>
                      <p className="text-2xl font-bold">{format(new Date(todaySession.clock_out), 'hh:mm a')}</p>
                    </div>
                   )}
                 </div>
               ) : (
                 <div className="text-center space-y-6">
                   <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                     <LogIn className="w-10 h-10 text-zinc-300" />
                   </div>
                   <div className="space-y-2">
                     <p className="text-2xl font-bold">Good Morning, {user?.name}</p>
                     <p className="text-zinc-500 text-sm">You haven't started your shift yet.</p>
                   </div>
                   <Button 
                     className="h-14 px-12 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 text-lg font-bold rounded-2xl"
                     onClick={handleClockIn}
                     disabled={clockInMutation.isPending || !!locError}
                   >
                     {clockInMutation.isPending ? 'Processing...' : 'Clock In to Shift'}
                     <LogIn className="ml-2 w-5 h-5" />
                   </Button>
                 </div>
               )}
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${location ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  <MapPin className={`w-4 h-4 ${location ? 'text-emerald-700' : 'text-red-700'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Location Verification</p>
                  <p className="text-xs text-zinc-500">{location ? 'Coordinates verified' : locError || 'Detecting location...'}</p>
                </div>
              </div>
              {location && <Badge variant="default" className="bg-[#ccff00] text-black hover:bg-[#ccff00]">Active</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="bg-zinc-950 text-white border-none shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#ccff00]" />
              Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-zinc-400">
            <div className="space-y-2">
              <p className="text-zinc-50 font-medium">GPS Verification</p>
              <p>Attendance is only valid when clocked in from the branch premise (within 200m).</p>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-zinc-50 font-medium">Overtime</p>
              <p>Shifts exceeding 9 hours require manager digital sign-off on the checkout screen.</p>
            </div>
            <div className="pt-6 mt-6 border-t border-zinc-800">
              <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mb-1">Assigned Branch</p>
              <p className="text-[#ccff00] font-bold text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Echo Main Console
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-zinc-400" />
              All Staff Attendance
            </CardTitle>
            <CardDescription>Daily log for all staff at this branch.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : attendanceData?.map((row : any) => (
                <TableRow key={row.id}>
                  <TableCell className="font-bold">{row.staff?.name}</TableCell>
                  <TableCell>{format(new Date(row.clock_in), 'hh:mm a')}</TableCell>
                  <TableCell>
                    {row.clock_out ? format(new Date(row.clock_out), 'hh:mm a') : (
                      <Badge variant="outline" className="text-zinc-400 animate-pulse">On Shift</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.clock_out ? '8.5h' : '--'}
                  </TableCell>
                  <TableCell>
                    {row.is_valid_location ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">VERIFIED</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">INVALID</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
