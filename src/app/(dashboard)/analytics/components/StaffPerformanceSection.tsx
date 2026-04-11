import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Users } from 'lucide-react'

interface StaffPerformanceSectionProps {
  data: {
    id: string
    name: string
    role: string
    bookingsCreated: number
    revenueHandled: number
  }[]
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-slate-100 text-slate-700',
  super_admin: 'bg-red-100 text-red-700',
}

export function StaffPerformanceSection({ data }: StaffPerformanceSectionProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenueHandled), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
          <Users className="w-4 h-4 text-blue-600" />
          Staff Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No staff activity in this period
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((member) => (
              <div key={member.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{member.name}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 border-transparent capitalize ${ROLE_COLORS[member.role] || ROLE_COLORS.staff}`}>
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      ₹{member.revenueHandled.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500">{member.bookingsCreated} bookings</p>
                  </div>
                </div>
                <Progress
                  value={(member.revenueHandled / maxRevenue) * 100}
                  className="h-1.5"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
