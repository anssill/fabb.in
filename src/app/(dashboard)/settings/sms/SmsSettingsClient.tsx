'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Save, MessageSquare, TestTube, Key } from 'lucide-react'
import { testSMSConnection } from './sms-actions'

const SMS_TEMPLATES = [
  {
    key: 'login_otp',
    label: 'Login OTP',
    default: 'Your Fabb.booking login OTP is {otp}. Valid for 5 minutes. Do not share this code.',
    variables: ['{otp}'],
  },
  {
    key: 'booking_confirmed',
    label: 'Booking Confirmed',
    default: 'Dear {name}, your booking {booking_id} is confirmed. Pickup: {pickup_date}. - {business_name}',
    variables: ['{name}', '{booking_id}', '{pickup_date}', '{business_name}'],
  },
  {
    key: 'pickup_reminder',
    label: 'Pickup Reminder',
    default: 'Hi {name}, reminder: pickup for booking {booking_id} is tomorrow at {time}. - {business_name}',
    variables: ['{name}', '{booking_id}', '{time}', '{business_name}'],
  },
  {
    key: 'return_reminder',
    label: 'Return Reminder',
    default: 'Hi {name}, please return items for booking {booking_id} by {return_date}. - {business_name}',
    variables: ['{name}', '{booking_id}', '{return_date}', '{business_name}'],
  },
  {
    key: 'overdue_notice',
    label: 'Overdue Notice',
    default: 'Dear {name}, your booking {booking_id} items are overdue since {return_date}. Please return immediately. - {business_name}',
    variables: ['{name}', '{booking_id}', '{return_date}', '{business_name}'],
  },
]

export function SmsSettingsClient() {
  const { activeBranch, setBranches, branches } = useAppStore()
  const supabase = createClient()
  const settings = ((activeBranch?.settings as any)?.sms) || {}

  const [isSaving, setIsSaving] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(settings.enabled ?? false)
  const [apiKey, setApiKey] = useState(settings.api_key ?? '')
  const [senderId, setSenderId] = useState(settings.sender_id ?? '')
  const [templates, setTemplates] = useState<Record<string, { body: string, templateId: string }>>(
    SMS_TEMPLATES.reduce((acc, t) => ({
      ...acc,
      [t.key]: {
        body: settings.templates?.[t.key]?.body ?? settings.templates?.[t.key] ?? t.default,
        templateId: settings.templates?.[t.key]?.templateId ?? ''
      },
    }), {})
  )

  async function handleSave() {
    if (!activeBranch) return
    setIsSaving(true)
    try {
      const branchSettings = (activeBranch.settings as any) || {}
      const newSettings = {
        ...branchSettings,
        sms: { enabled: smsEnabled, api_key: apiKey, sender_id: senderId, templates }
      }
      const { error } = await supabase
        .from('branches')
        .update({ settings: newSettings })
        .eq('id', activeBranch.id)
      if (error) throw error
      setBranches(branches.map(b => b.id === activeBranch.id ? { ...b, settings: newSettings } : b))
      toast.success('SMS settings saved')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save SMS settings')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTestSms() {
    const phone = window.prompt('Enter 10-digit mobile number to send test SMS:')
    if (!phone) return

    toast.promise(testSMSConnection(phone), {
      loading: 'Sending test SMS...',
      success: (res) => {
        if (!res.success) throw new Error(res.error as string)
        return 'Test SMS sent successfully!'
      },
      error: (err) => err.message || 'Failed to send test SMS'
    })
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-500" /> MSG91 Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable SMS Notifications</p>
              <p className="text-xs text-slate-400 mt-0.5">Send automated SMS to customers for booking events</p>
            </div>
            <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
          </div>

          {smsEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5" /> MSG91 API Key
                  </Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Your MSG91 API key"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sender ID</Label>
                  <Input
                    value={senderId}
                    onChange={e => setSenderId(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="FABBKG"
                    maxLength={6}
                    className="font-mono uppercase"
                  />
                  <p className="text-xs text-slate-400">6-character DLT registered sender ID</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleTestSms} className="h-8 text-xs">
                <TestTube className="w-3.5 h-3.5 mr-1.5" /> Send Test SMS
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {smsEnabled && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">SMS Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {SMS_TEMPLATES.map((template, idx) => (
              <div key={template.key}>
                {idx > 0 && <Separator className="mb-6" />}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">{template.label}</Label>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {template.variables.map(v => (
                        <Badge key={v} variant="outline" className="text-[10px] font-mono py-0 h-4">{v}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1 space-y-1.5">
                      <Label className="text-xs text-slate-500">Template ID</Label>
                      <Input
                        value={templates[template.key].templateId}
                        onChange={(e) => setTemplates(p => ({ 
                          ...p, 
                          [template.key]: { ...p[template.key], templateId: e.target.value } 
                        }))}
                        placeholder="e.g. 1207..."
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-xs text-slate-500">Message body (DLT Approved)</Label>
                      <Textarea
                        value={templates[template.key].body}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTemplates(p => ({ 
                          ...p, 
                          [template.key]: { ...p[template.key], body: e.target.value } 
                        }))}
                        rows={2}
                        className="text-sm"
                      />
                      <p className="text-[10px] text-slate-400 text-right">{(templates[template.key].body as string)?.length ?? 0} chars</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save SMS settings</>}
        </Button>
      </div>
    </div>
  )
}
