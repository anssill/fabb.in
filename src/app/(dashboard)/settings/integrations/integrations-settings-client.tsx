import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, MessageSquare, ShieldCheck } from 'lucide-react'

const providers = [
  {
    name: 'Meta WhatsApp Cloud API',
    description: 'Booking lifecycle messages, reminders and delivery status through Meta’s official API.',
    icon: MessageCircle,
    variables: 'WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID',
  },
  {
    name: 'MSG91 SMS',
    description: 'Transactional booking reminders and delivery tracking for SMS messages.',
    icon: MessageSquare,
    variables: 'MSG91_AUTH_KEY and MSG91_SENDER_ID',
  },
]

export function IntegrationsSettingsClient() {
  return (
    <div className="space-y-4">
      {providers.map(({ name, description, icon: Icon, variables }) => (
        <Card key={name} className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="text-base">{name}</CardTitle>
                  <CardDescription className="mt-1">{description}</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">Disabled at launch</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Provider credentials are server-only. Configure {variables} in Vercel when messaging is ready; secrets are never stored in branch settings.
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
