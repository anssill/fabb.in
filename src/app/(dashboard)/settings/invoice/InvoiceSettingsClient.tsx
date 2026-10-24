'use client'

import { InvoiceDocument } from '@/components/invoices/InvoiceDocument'
import { buildInvoice, invoiceSettings } from '@/lib/invoice'
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
import { Save, FileText, Hash, Building2, CreditCard, Eye } from 'lucide-react'

function InvoicePreview({
  invoicePrefix,
  gstEnabled,
  gstRate,
  footerText,
  termsText,
  showLogo,
  showBankDetails,
  bankName,
  bankAccount,
  bankIfsc,
  signatureLine,
  businessName,
  gstin,
  logoUrl,
  address,
}: {
  invoicePrefix: string
  gstEnabled: boolean
  gstRate: number
  footerText: string
  termsText: string
  showLogo: boolean
  showBankDetails: boolean
  bankName: string
  bankAccount: string
  bankIfsc: string
  signatureLine: boolean
  businessName: string
  gstin: string
  logoUrl: string
  address: string
}) {
  const sampleAmount = 2500
  const tax = gstEnabled ? Math.round(sampleAmount * gstRate) / 100 : 0
  const invoice = buildInvoice({
    booking_number: 'BK-2026-0001', created_at: new Date().toISOString(), pickup_date: '2026-10-01', return_date: '2026-10-03',
    customer: { name: 'Sample Customer', phone: '+91 98765 43210' },
    subtotal: sampleAmount, discount_amount: 0, tax_amount: tax, total_amount: sampleAmount + tax,
    booking_items: [{ item_name: 'Bridal Lehenga Set', size: 'M', quantity: 1, price: 2500, rate_basis: 'booking' }],
    booking_payments: [{ type: 'advance', method: 'cash', amount: 2000 }],
  }, { name: businessName, gst_number: gstin, logo_url: logoUrl, address }, { settings: { invoice: {
    prefix: invoicePrefix, gst_enabled: gstEnabled, gst_rate: gstRate, footer_text: footerText, terms_text: termsText,
    show_logo: showLogo, show_bank_details: showBankDetails, bank_name: bankName, bank_account: bankAccount, bank_ifsc: bankIfsc, signature_line: signatureLine,
  } } })
  return <div className="mx-auto w-fit max-w-full overflow-x-auto rounded-lg border bg-white shadow-sm"><InvoiceDocument invoice={invoice}/></div>
}

export function InvoiceSettingsClient() {
  const branch = useAppStore(state => state.activeBranch)
  if (!branch) return <p className="text-sm text-muted-foreground">Loading branch settings...</p>
  return <InvoiceSettingsClientForm key={branch.id} />
}

function InvoiceSettingsClientForm() {
  const { activeBranch, setBranches, branches, business } = useAppStore()
  const supabase = createClient()
  const settings = invoiceSettings(activeBranch?.settings?.invoice, business?.name || 'us')
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
  const [invoiceTemplate, setInvoiceTemplate] = useState(settings.whatsapp_invoice_template)
  const [statusTemplate, setStatusTemplate] = useState(settings.whatsapp_status_template)

  async function handleSave() {
    if (!activeBranch) return
    if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) { toast.error('Enter a GST rate from 0 to 100'); return }
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
          whatsapp_invoice_template: invoiceTemplate,
          whatsapp_status_template: statusTemplate,
        }
      }
      const { error } = await supabase
        .from('branches')
        .update({ settings: newSettings })
        .eq('id', activeBranch.id).select('id').single()
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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Left: Settings Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">WhatsApp messages</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="whatsapp-invoice">Invoice message</Label><Textarea id="whatsapp-invoice" rows={6} value={invoiceTemplate} onChange={e => setInvoiceTemplate(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="whatsapp-status">Booking status message</Label><Textarea id="whatsapp-status" rows={5} value={statusTemplate} onChange={e => setStatusTemplate(e.target.value)} /></div>
            <p className="text-xs text-muted-foreground">Use these placeholders to insert booking details automatically:</p>
            <p className="break-words text-xs font-mono">{'{customer_name}, {business_name}, {booking_number}, {invoice_number}, {status}, {pickup_date}, {return_date}, {total}, {paid}, {balance}'}</p>
            <p className="text-xs text-muted-foreground">Saved for this branch. Invoice sharing includes the invoice image; status sharing sends text.</p>
          </CardContent>
        </Card>
        {/* Invoice Numbering */}
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
                  {invoicePrefix || 'INV'}-BK-2026-0001
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

        {/* Invoice Content */}
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
                <p className="text-xs text-slate-400 mt-0.5">Adds signature line at the bottom</p>
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
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save Invoice Settings</>}
          </Button>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="xl:sticky xl:top-4 self-start">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-700">Live Preview</p>
          <span className="text-xs text-slate-400">(80 mm thermal · sample data)</span>
        </div>
        <InvoicePreview
          invoicePrefix={invoicePrefix}
          gstEnabled={gstEnabled}
          gstRate={gstRate}
          footerText={footerText}
          termsText={termsText}
          showLogo={showLogo}
          showBankDetails={showBankDetails}
          bankName={bankName}
          bankAccount={bankAccount}
          bankIfsc={bankIfsc}
          signatureLine={signatureLine}
          businessName={business?.name || ''}
          gstin={business?.gst_number || ''}
          logoUrl={business?.logo_url || ''}
          address={[business?.address, business?.city, business?.state].filter(Boolean).join(', ')}
        />
      </div>
    </div>
  )
}
