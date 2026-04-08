import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Clock, MessageSquare, ShieldCheck, Zap } from 'lucide-react'

export const metadata = { title: 'Billing | Fabb.booking' }

export default function BillingPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Billing &amp; Subscription</h2>
        <p className="text-sm text-slate-500">Your plan is managed directly by Fabb.booking. Contact us for changes.</p>
      </div>

      {/* Current Plan */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-slate-900">Custom Plan</p>
                <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">Pricing negotiated directly with Ansil</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Billed via</p>
              <p className="text-sm font-medium text-slate-700">UPI / Bank Transfer</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Bookings', value: 'Unlimited' },
              { label: 'Staff Accounts', value: 'Unlimited' },
              { label: 'Branches', value: 'Unlimited' },
              { label: 'Storage', value: '10 GB' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Included */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">What&apos;s Included</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: ShieldCheck, label: 'Booking & inventory management' },
              { icon: CreditCard, label: 'Payment tracking & receipts' },
              { icon: Clock, label: 'Washing queue tracking' },
              { icon: MessageSquare, label: 'SMS notifications (MSG91)' },
              { icon: Zap, label: 'Analytics & reporting' },
              { icon: ShieldCheck, label: 'Multi-branch support' },
              { icon: CreditCard, label: 'GST invoice generation' },
              { icon: ShieldCheck, label: 'Role-based access control' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Icon className="w-3 h-3 text-green-600" />
                </div>
                {label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="shadow-sm border-blue-100 bg-blue-50/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Need to make changes to your plan?</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Contact Ansil directly on WhatsApp to upgrade, downgrade, or discuss your billing requirements.
              </p>
              <Button className="mt-3 bg-green-600 hover:bg-green-700 text-white h-8 text-xs" asChild>
                <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
