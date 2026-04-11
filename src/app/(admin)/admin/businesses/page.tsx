import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, Globe, Mail, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { BusinessActions } from './BusinessActions'

export default async function AdminBusinessesPage() {
  const supabase = await createClient()

  const { data: businesses } = await supabase
    .from('businesses')
    .select(`
      *,
      staff(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Business Directory</h1>
          <p className="text-sm text-slate-500">Manage all businesses using the platform.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Onboard New Business
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by name, slug, or owner..." className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 border-none" />
          </div>
          <Button variant="outline" className="h-10">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {businesses?.map((biz) => (
          <Card key={biz.id} className="border-none shadow-sm bg-white dark:bg-slate-900 group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {biz.name[0]}
                </div>
                <BusinessActions
                  businessId={biz.id}
                  currentStatus={biz.status}
                  businessName={biz.name}
                />
              </div>

              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {biz.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={biz.status === 'active' ? 'default' : 'secondary'} className="h-5 text-[10px] uppercase tracking-wider">
                    {biz.status}
                  </Badge>
                  <span className="text-xs text-slate-400">ID: {biz.slug}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Globe className="w-4 h-4" />
                  <span className="truncate">fabb.com/{biz.slug}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{biz.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{biz.city}, {biz.state}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Staff</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{biz.staff?.[0]?.count || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Rev</p>
                    <p className="font-semibold text-slate-900 dark:text-white">--</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8" asChild>
                  <Link href={`/admin/businesses/${biz.id}`}>Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
