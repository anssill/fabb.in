'use client'

import { useState } from 'react'
import { 
  useStaffList, 
  useAttendance, 
  useClockIn, 
  useClockOut, 
  usePendingStaffApprovals, 
  useApproveStaff 
} from '@/lib/queries/useStaff'
import { useStaffPerformance } from '@/lib/queries/useAudit'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Clock, 
  ShieldCheck, 
  UserPlus, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  LogOut, 
  LogIn,
  MoreVertical,
  Activity,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserStore } from '@/lib/stores/useUserStore'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function StaffPage() {
  const { profile: user } = useUserStore()
  const { data: staffList, isLoading: isStaffLoading } = useStaffList()
  const { data: attendance, isLoading: isAttendanceLoading } = useAttendance()
  const { data: pendingApprovals } = usePendingStaffApprovals()
  const { data: performanceData } = useStaffPerformance()
  
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const approveStaff = useApproveStaff()

  const isClockedIn = attendance?.some(a => a.staff_id === user?.id && !a.clock_out)
  const currentAttendance = attendance?.find(a => a.staff_id === user?.id && !a.clock_out)

  const handleClockToggle = () => {
    if (isClockedIn) {
      clockOut.mutate(currentAttendance.id)
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => clockIn.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => clockIn.mutate({ lat: 0, lng: 0 }) 
      )
    }
  }

  const isStaffManagementAllowed = user?.role === 'manager' || user?.role === 'super_admin'

  if (isStaffLoading || isAttendanceLoading) return <div className="p-8 space-y-4 pt-20"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 w-full" /></div>

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Staff & Operations</h1>
          <p className="text-zinc-500">Manage directory, attendance, and branch permissions</p>
        </div>
        
        <div className={`p-1.5 rounded-2xl flex items-center gap-2 border ${isClockedIn ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`h-10 px-4 rounded-xl flex items-center justify-center font-bold text-sm ${isClockedIn ? 'text-emerald-700' : 'text-red-700'}`}>
            <Clock className="h-4 w-4 mr-2" />
            {isClockedIn ? `Clocked In at ${format(new Date(currentAttendance.clock_in), 'HH:mm')}` : 'Currently Clocked Out'}
          </div>
          <Button 
            className={`rounded-xl px-6 h-10 shadow-lg transition-transform active:scale-95 ${isClockedIn ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'}`}
            onClick={handleClockToggle}
            disabled={clockIn.isPending || clockOut.isPending}
          >
            {isClockedIn ? <LogOut className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
            {isClockedIn ? 'Clock Out' : 'Clock In Now'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList className="bg-zinc-100/50 p-1 border border-zinc-200">
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
          <TabsTrigger value="performance">Performance Insights</TabsTrigger>
          {isStaffManagementAllowed && (
            <TabsTrigger value="approvals" className="relative">
              Pending Approvals
              {pendingApprovals && pendingApprovals.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="directory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffList?.map((staff) => (
              <Card key={staff.id} className="border-zinc-100 shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="pt-6 relative">
                  {isStaffManagementAllowed && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Deactivate Staff</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold">
                      {staff.name?.[0] || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900">{staff.name}</h3>
                      <p className="text-xs text-zinc-500 capitalize">{staff.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pb-4">
                    <div className="flex items-center text-xs text-zinc-600">
                      <Users className="h-3 w-3 mr-2 opacity-40" />
                      {staff.email}
                    </div>
                    {staff.phone && (
                      <div className="flex items-center text-xs text-zinc-600">
                        <MapPin className="h-3 w-3 mr-2 opacity-40" />
                        {staff.phone}
                      </div>
                    )}
                  </div>
                  {performanceData?.find(p => p.id === staff.id) && (
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-50">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Revenue</p>
                        <p className="text-xs font-bold text-zinc-900">
                          ₹{performanceData.find(p => p.id === staff.id)?.revenueGenerated.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-0.5 border-l border-zinc-100 pl-3">
                        <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Accuracy</p>
                        <p className="text-xs font-bold text-zinc-900">
                          {performanceData.find(p => p.id === staff.id)?.efficiency}%
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-50">
                    <Badge variant={staff.status === 'approved' ? 'outline' : 'secondary'} className="text-[10px] h-5 capitalize">
                      {staff.status}
                    </Badge>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest">ID: {staff.id.slice(0, 8)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="border-zinc-100 overflow-hidden shadow-sm">
            <CardHeader className="bg-white border-b border-zinc-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Daily Attendance Ledger</CardTitle>
                  <CardDescription>Live tracking for {format(new Date(), 'PPP')}</CardDescription>
                </div>
                <Button variant="outline" size="sm"><Activity className="h-4 w-4 mr-2" /> Weekly Report</Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-semibold">{record.staff.name}</TableCell>
                    <TableCell className="capitalize text-xs text-zinc-500">{record.staff.role}</TableCell>
                    <TableCell className="text-xs">{format(new Date(record.clock_in), 'HH:mm')}</TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {record.clock_out ? format(new Date(record.clock_out), 'HH:mm') : <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">On Duty</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] h-5 ${record.is_valid_location ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                        {record.is_valid_location ? <ShieldCheck className="h-3 w-3 mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                        {record.is_valid_location ? 'Within Geofence' : 'Remote'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{record.clock_out ? '8.5h' : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <Card className="bg-zinc-950 text-white p-6 flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Top Performer</p>
                <h4 className="text-xl font-bold italic tracking-tighter text-[#ccff00]">{performanceData?.[0]?.name || 'Calculating...'}</h4>
             </Card>
             <Card className="border-zinc-100 p-6 flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Avg Accuracy</p>
                <h4 className="text-xl font-bold text-zinc-900">94.2%</h4>
             </Card>
             <Card className="border-zinc-100 p-6 flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Active Shifts</p>
                <h4 className="text-xl font-bold text-zinc-900">{attendance?.length || 0} Members</h4>
             </Card>
             <Card className="border-zinc-100 p-6 flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Ops Efficiency</p>
                <h4 className="text-xl font-bold text-zinc-900">Optimal</h4>
             </Card>
          </div>
          <Card className="border-zinc-100 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
               <CardTitle className="text-lg">Staff Contribution Ledger</CardTitle>
               <CardDescription>Revenue and booking attribution for the current period</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Sessions</TableHead><TableHead>Accuracy</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
              <TableBody>
                {performanceData?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold">{p.name}</TableCell>
                    <TableCell className="font-medium">{p.bookingCount}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-zinc-900" style={{ width: `${p.efficiency}%` }} /></div>
                          <span className="text-xs font-bold">{p.efficiency}%</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right font-black italic tracking-tighter">₹{p.revenueGenerated.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <div className="space-y-4">
            {pendingApprovals && pendingApprovals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingApprovals.map((p) => (
                  <Card key={p.id} className="border-zinc-100 shadow-sm border-2 border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400"><UserPlus className="h-6 w-6" /></div>
                        <div><h3 className="font-bold text-zinc-900">{p.name}</h3><p className="text-xs text-zinc-500 capitalize">{p.role}</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => approveStaff.mutate(p.id)} disabled={approveStaff.isPending}><CheckCircle2 className="h-4 w-4 mr-2" /> Approve</Button>
                        <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 border-red-100"><XCircle className="h-4 w-4 mr-2" /> Ignore</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-zinc-200 py-16 text-center text-zinc-400">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-10" />
                No pending login requests
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
