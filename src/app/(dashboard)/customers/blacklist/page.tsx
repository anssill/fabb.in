import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldAlert, User, Phone, ChevronLeft, IndianRupee } from 'lucide-react'
import Link from 'next/link'
import { BlacklistActions } from './BlacklistActions'

export const metadata = { title: 'Blacklisted Customers | Fabb.booking' }

export default async function BlacklistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase.from('staff').select('business_id, branch_id').eq('id', user.id).single()
  if (!staff) return null

  const { data: blacklisted, count } = await supabase
    .from('customers')
    .select('id, name, phone, email, total_bookings, total_spent, outstanding_balance, blacklisted_reason, blacklisted_at, created_at', { count: 'exact' })
    .eq('business_id', staff.business_id)
    .eq('branch_id', staff.branch_id)
    .eq('blacklisted', true)
    .order('blacklisted_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customers"><ChevronLeft className="w-4 h-4 mr-1" />Customers</Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            Blacklisted Customers
          </h1>
          <p className="text-sm text-slate-500">{count ?? 0} customer{count !== 1 ? 's' : ''} on blacklist</p>
        </div>
      </div>

      {(!blacklisted || blacklisted.length === 0) ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-slate-200" />
            <p className="text-lg font-medium text-slate-700">No blacklisted customers</p>
            <p className="text-sm text-slate-400 mt-1">Customers you blacklist will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Blacklist ({count ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {blacklisted.map((customer: any) => (
                <div key={customer.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/customers/${customer.id}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                          {customer.name}
                        </Link>
                        <Badge className="text-xs bg-red-100 text-red-700">Blacklisted</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{customer.phone}
                        </span>
                        {Number(customer.outstanding_balance) > 0 && (
                          <span className="text-xs text-red-600 font-medium flex items-center gap-0.5">
                            <IndianRupee className="w-3 h-3" />
                            {Number(customer.outstanding_balance).toLocaleString('en-IN')} outstanding
                          </span>
                        )}
                      </div>
                      {customer.blacklisted_reason && (
                        <p className="text-xs text-slate-400 mt-1 italic">&quot;{customer.blacklisted_reason}&quot;</p>
                      )}
                      {customer.blacklisted_at && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Blacklisted {new Date(customer.blacklisted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block mr-2">
                      <p className="text-xs text-slate-400">{customer.total_bookings ?? 0} bookings</p>
                      <p className="text-xs text-slate-500">₹{Number(customer.total_spent ?? 0).toLocaleString('en-IN')} spent</p>
                    </div>
                    <BlacklistActions customerId={customer.id} customerName={customer.name} />
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/customers/${customer.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
