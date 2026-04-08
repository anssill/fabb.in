'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Save, FileText, Hash, Building2, CreditCard } from 'lucide-react'

export function InvoiceSettingsClient() {
  const { activeBranch, setBranches, branches, business } = useAppStore()
  const supabase = createClient()
  const settings = ((activeBranch?.settings as any)?.invoice) || {}
  const [isSaving, setIsSaving] = useState(false)

  const [invoicePrefix, setInvoicePrefix] = useState(settings.prefix ?? 'INV')
  const [gstEnabled, setGstEnabled] = useState(settings.gst_enabled ?? true)
  const [gstRate, setGstRate] = useState(settings.gst_rate ?? 18)
  const [footerText, setFooterText] = useState(settings.footer_text ?? 'Thank you for choosing us. Items must be returned in the same condition.')
  const [termsText, setTermsText] = useState(settings.terms_text ?? 'Items are rented as-is. Any damage will be charged separately.')
  const [showBankDetails, setShowBankDetails] = useState(settings.show_bank_details ?? false)
  const [showLogo, setShowLogo] = useState(settings.show_logo ?? true)
  const [bankName, setBankName] = useState(settings.bank_name ?? '')
  const [bankAccount, setBankAccount] = useState(settings.bank_account ?? '')
  const [bankIfsc, setBankIfsc] = useState(settings.bank_ifsc ?? '')
  const [signatureLine, setSignatureLine] = useState(settings.signature_line ?? true)

  async function handleSave() {
    if (!activeBranch) return
    setIsSaving(true)
    try {
      const branchSettings = (activeBranch.settings as any) || {}
      const newSettings = {
        ...branchSettings,
        invoice: {
          prefix: invoicePrefix,
          gst_enabled: gstEnabled,
          gst_rate: gstRate,
          show_logo: showLogo,
          footer_text: footerText,
          terms_text: termsText,
          show_bank_details: showBankDetails,
          bank_name: bankName,
          bank_account: bankAccount,
          bank_ifsc: bankIfsc,
          signature_line: signatureLine,
        }
      }
      const { error } = await supabase
        .from('branches')
        .update({ settings: newSettings })
        .eq('id', activeBranch.id)
      if (error) throw error
      setBranches(branches.map(b => b.id === activeBranch.id ? { ...b, settings: newSettings } : b))
      toast.success('Invoice settings saved')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save invoice settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Invoice Number */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-500" /> Invoice Numbering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Invoice Prefix</Label>
              <Input value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value.toUpperCase().slice(0, 5))} placeholder="INV" className="font-mono uppercase" />
            </div>
            <div className="space-y-1.5">
              <Label>Format Preview</Label>
              <div className="h-9 bg-slate-50 border border-slate-200 rounded-md px-3 flex items-center text-sm font-mono text-slate-600">
                {invoicePrefix || 'INV'}-2026-001
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GST Settings */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" /> GST Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Apply GST on invoices</p>
              <p className="text-xs text-slate-400 mt-0.5">Adds GST line to invoice automatically</p>
            </div>
            <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
          </div>
          {gstEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>GST Rate (%)</Label>
                  <Input type="number" value={gstRate} onChange={e => setGstRate(Number(e.target.value))} min={0} max={28} />
                </div>
                <div className="space-y-1.5">
                  <Label>GSTIN</Label>
                  <Input value={business?.gst_number || ''} readOnly placeholder="Set in Company Profile" className="bg-slate-50 text-slate-500" />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice Footer */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Invoice Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Footer Text</Label>
            <Textarea
              value={footerText}
              onChange={e => setFooterText(e.target.value)}
              placeholder="Thank you for choosing us..."
              rows={2}
              maxLength={300}
            />
            <p className="text-xs text-slate-400 text-right">{footerText.length}/300</p>
          </div>
          <div className="space-y-1.5">
            <Label>Terms & Conditions</Label>
            <Textarea
              value={termsText}
              onChange={e => setTermsText(e.target.value)}
              placeholder="Items are rented as-is..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-slate-400 text-right">{termsText.length}/500</p>
          </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium">Show business logo</p>
                <p className="text-xs text-slate-400 mt-0.5">Displays your company logo at the top</p>
              </div>
              <Switch checked={showLogo} onCheckedChange={setShowLogo} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium">Show Authorised Signatory line</p>
                <p className="text-xs text-slate-400 mt-0.5">Adds &quot;Authorised Signatory&quot; at the bottom</p>
              </div>
              <Switch checked={signatureLine} onCheckedChange={setSignatureLine} />
            </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-500" /> Bank Details on Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Show bank details</p>
              <p className="text-xs text-slate-400 mt-0.5">Displays your bank account info for transfers</p>
            </div>
            <Switch checked={showBankDetails} onCheckedChange={setShowBankDetails} />
          </div>
          {showBankDetails && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="State Bank of India" />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Number</Label>
                  <Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="12345678901" />
                </div>
                <div className="space-y-1.5">
                  <Label>IFSC Code</Label>
                  <Input value={bankIfsc} onChange={e => setBankIfsc(e.target.value.toUpperCase())} placeholder="SBIN0001234" className="font-mono uppercase" />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save invoice settings</>}
        </Button>
      </div>
    </div>
  )
}
