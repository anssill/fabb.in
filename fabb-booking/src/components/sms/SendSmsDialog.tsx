'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

interface SendSmsDialogProps {
  isOpen: boolean
  onClose: () => void
  phone: string
  customerId?: string
  bookingId?: string
  bookingNumber?: string
  customerName?: string
  defaultTemplate?: string
  variables?: Record<string, string>
}

const SMS_TEMPLATES = [
  { key: 'booking_confirmed', label: 'Booking Confirmed' },
  { key: 'pickup_reminder', label: 'Pickup Reminder' },
  { key: 'return_reminder', label: 'Return Reminder' },
  { key: 'overdue_notice', label: 'Overdue Notice' },
]

export function SendSmsDialog({
  isOpen,
  onClose,
  phone,
  customerId,
  bookingId,
  bookingNumber,
  customerName,
  defaultTemplate,
  variables = {}
}: SendSmsDialogProps) {
  const { activeBranch } = useAppStore()
  const supabase = createClient()
  const [isSending, setIsSending] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultTemplate || '')
  const [preview, setPreview] = useState('')

  const smsSettings = (activeBranch?.settings as any)?.sms
  const isEnabled = smsSettings?.enabled
  const templates = smsSettings?.templates || {}

  useEffect(() => {
    if (selectedTemplate && templates[selectedTemplate]) {
      let body = templates[selectedTemplate].body || ''
      const allVars = {
        '{name}': customerName || 'Customer',
        '{booking_id}': bookingNumber || 'Booking',
        '{business_name}': activeBranch?.name || 'Fabb.booking',
        ...variables
      }

      Object.entries(allVars).forEach(([key, val]) => {
        body = body.replace(new RegExp(key, 'g'), val)
      })
      setPreview(body)
    } else {
      setPreview('')
    }
  }, [selectedTemplate, templates, customerName, bookingNumber, activeBranch, variables])

  async function handleSend() {
    if (!isEnabled) {
      toast.error('SMS notifications are disabled for this branch')
      return
    }

    const templateData = templates[selectedTemplate]
    if (!templateData?.templateId) {
      toast.error('Template ID is missing for this event. Please check SMS settings.')
      return
    }

    setIsSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const payload = {
        to: phone,
        template_id: templateData.templateId,
        variables: {
          name: customerName || 'Customer',
          booking_id: bookingNumber || 'Booking',
          business_name: activeBranch?.name || 'Fabb.booking',
          ...Object.fromEntries(
            Object.entries(variables).map(([k, v]) => [k.replace(/[{}]/g, ''), v])
          )
        },
        business_id: (activeBranch as any)?.business_id || (activeBranch?.settings as any)?.business_id,
        branch_id: activeBranch?.id,
        customer_id: customerId,
        booking_id: bookingId,
        sent_by: user?.id
      }

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: payload
      })

      if (error) throw error
      
      toast.success('SMS sent successfully')
      onClose()
    } catch (error: any) {
      console.error('SMS Error:', error)
      toast.error(error.message || 'Failed to send SMS')
    } finally {
      setIsSending(false)
    }
  }

  if (!isEnabled && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> SMS Disabled
            </DialogTitle>
            <DialogDescription>
              SMS notifications are currently disabled for this branch. Please enable them in Settings &gt; SMS.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" /> Send SMS Notification
          </DialogTitle>
          <DialogDescription>
            Selected recipient: <span className="font-semibold text-slate-900">{phone}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {SMS_TEMPLATES.map(t => (
                  <SelectItem key={t.key} value={t.key} disabled={!templates[t.key]?.templateId}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{t.label}</span>
                      {!templates[t.key]?.templateId && (
                        <Badge variant="outline" className="text-[10px] text-red-500 border-red-200 bg-red-50">Config Needed</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Preview</Label>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 italic">
                "{preview}"
              </div>
              <p className="text-[10px] text-slate-400">
                Variables: {Object.keys(variables).join(', ')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            disabled={!selectedTemplate || isSending}
            onClick={handleSend}
          >
            {isSending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Send SMS Now</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
