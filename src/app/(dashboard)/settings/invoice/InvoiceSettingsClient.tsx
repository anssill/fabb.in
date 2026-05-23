'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import type { BranchData, BusinessData } from '@/lib/store'
import { safeJsonParse } from '@/lib/api-utils'
import { toast } from 'sonner'
import { Save, FileText, Hash, CreditCard, Eye, Printer } from 'lucide-react'

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
  printFormat,
  businessName,
  gstin,
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
  printFormat: string
  businessName: string
  gstin: string
}) {
  const sampleAmount = 5000
  const gstAmount = gstEnabled ? Math.round(sampleAmount * gstRate / 100) : 0
  const total = sampleAmount + gstAmount

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm text-[10px] font-sans" style={{ minHeight: printFormat === 'vyapar_3inch' ? '620px' : '560px', padding: '20px' }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-3">
        <div>
          {showLogo && (
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold mb-1">F</div>
          )}
          <p className="font-bold text-slate-900 text-xs">{businessName || 'Your Business Name'}</p>
          {gstin && gstEnabled && <p className="text-slate-500">GSTIN: {gstin}</p>}
          <p className="text-slate-500">Kerala, India</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-blue-600 text-sm">INVOICE</p>
          <p className="text-slate-500">{invoicePrefix || 'INV'}-2026-001</p>
          <p className="text-slate-500 mt-1">Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Customer + Booking */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-slate-500 uppercase tracking-wide" style={{ fontSize: '8px' }}>Bill To</p>
          <p className="font-semibold text-slate-900">Sample Customer</p>
          <p className="text-slate-500">+91 98765 43210</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase tracking-wide" style={{ fontSize: '8px' }}>Booking</p>
          <p className="font-mono text-slate-900">BK-2026-0001</p>
          <p className="text-slate-500">26 Mar – 28 Mar 2026 (2 days)</p>
        </div>
      </div>

      {/* Items table */}
      <table className="w-full mb-3" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th className="text-left p-1 text-slate-500">Item</th>
            <th className="text-right p-1 text-slate-500">Qty</th>
            <th className="text-right p-1 text-slate-500">Rate/day</th>
            <th className="text-right p-1 text-slate-500">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td className="p-1 text-slate-700">Bridal Lehenga Set · Size M</td>
            <td className="p-1 text-right text-slate-700">1</td>
            <td className="p-1 text-right text-slate-700">₹2,500</td>
            <td className="p-1 text-right text-slate-700">₹5,000</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-3">
        <div className="w-40 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="text-slate-700">₹{sampleAmount.toLocaleString('en-IN')}</span>
          </div>
          {gstEnabled && (
            <div className="flex justify-between">
              <span className="text-slate-500">GST ({gstRate}%)</span>
              <span className="text-slate-700">₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-slate-200 pt-1">
            <span className="text-slate-900">Total</span>
            <span className="text-blue-600">₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Advance Paid</span>
            <span className="text-slate-700 text-emerald-600">-₹2,000</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-slate-700">Balance Due</span>
            <span className="text-red-600">₹{(total - 2000).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      {showBankDetails && (bankName || bankAccount) && (
        <div className="border border-slate-200 rounded p-2 mb-2 bg-slate-50">
          <p className="text-slate-500 uppercase tracking-wide mb-1" style={{ fontSize: '8px' }}>Bank Details</p>
          <p className="text-slate-700">{bankName || 'Bank Name'}</p>
          {bankAccount && <p className="text-slate-600">A/C: {bankAccount}</p>}
          {bankIfsc && <p className="text-slate-600 font-mono">IFSC: {bankIfsc}</p>}
        </div>
      )}

      {/* Terms */}
      {termsText && (
        <div className="mb-2">
          <p className="text-slate-500 uppercase tracking-wide mb-0.5" style={{ fontSize: '8px' }}>Terms</p>
          <p className="text-slate-500">{termsText.slice(0, 120)}{termsText.length > 120 ? '...' : ''}</p>
        </div>
      )}

      {/* Footer */}
      {footerText && (
        <p className="text-center text-slate-500 border-t border-slate-200 pt-2">{footerText.slice(0, 80)}</p>
      )}

      {/* Signature */}
      {signatureLine && (
        <div className="flex justify-end mt-3">
          <div className="text-center">
            <div className="w-24 border-b border-slate-400 mb-0.5" />
            <p className="text-slate-500">Authorised Signatory</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function InvoiceSettingsClient({
  initialBranch,
  initialBranches,
  initialBusiness,
}: {
  initialBranch: BranchData | null
  initialBranches: BranchData[]
  initialBusiness: BusinessData | null
}) {
  const { activeBranch, setActiveBranch, setBranches, branches, business, setBusiness } = useAppStore()
  const currentBranch = activeBranch || initialBranch
  const currentBranches = branches.length > 0 ? branches : initialBranches
  const currentBusiness = business || initialBusiness
  const settings = ((currentBranch?.settings as any)?.invoice) || {}
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
  const [printFormat, setPrintFormat] = useState(settings.print_format ?? 'vyapar_3inch')
  const [paperWidthMm, setPaperWidthMm] = useState(settings.paper_width_mm ?? 80)
  const [vyaparCounterName, setVyaparCounterName] = useState(settings.vyapar_counter_name ?? '')

  useEffect(() => {
    if (initialBusiness && (!business || business.id !== initialBusiness.id)) {
      setBusiness(initialBusiness)
    }
    if (initialBranches.length > 0 && branches.length === 0) {
      setBranches(initialBranches)
    }
    if (initialBranch && !activeBranch) {
      setActiveBranch(initialBranch)
    }
  }, [activeBranch, branches.length, business, initialBranch, initialBranches, initialBusiness, setActiveBranch, setBranches, setBusiness])

  useEffect(() => {
    const nextSettings = ((currentBranch?.settings as any)?.invoice) || {}
    setInvoicePrefix(nextSettings.prefix ?? 'INV')
    setGstEnabled(nextSettings.gst_enabled ?? true)
    setGstRate(nextSettings.gst_rate ?? 18)
    setFooterText(nextSettings.footer_text ?? 'Thank you for choosing us. Items must be returned in the same condition.')
    setTermsText(nextSettings.terms_text ?? 'Items are rented as-is. Any damage will be charged separately.')
    setShowBankDetails(nextSettings.show_bank_details ?? false)
    setShowLogo(nextSettings.show_logo ?? true)
    setBankName(nextSettings.bank_name ?? '')
    setBankAccount(nextSettings.bank_account ?? '')
    setBankIfsc(nextSettings.bank_ifsc ?? '')
    setSignatureLine(nextSettings.signature_line ?? true)
    setPrintFormat(nextSettings.print_format ?? 'vyapar_3inch')
    setPaperWidthMm(nextSettings.paper_width_mm ?? 80)
    setVyaparCounterName(nextSettings.vyapar_counter_name ?? '')
  }, [currentBranch])

  async function handleSave() {
    if (!currentBranch) return
    setIsSaving(true)
    try {
      const branchSettings = (currentBranch.settings as any) || {}
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
          print_format: printFormat,
          paper_width_mm: paperWidthMm,
          vyapar_counter_name: vyaparCounterName || null,
        }
      }
      const res = await fetch('/api/settings/branch-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: currentBranch.id, settings: newSettings }),
      })
      const result = await safeJsonParse(res)
      if (!res.ok) throw new Error(result.error || 'Failed to save invoice settings')

      const updatedBranch = result.branch || { ...currentBranch, settings: newSettings }
      setBranches(currentBranches.map(b => b.id === currentBranch.id ? updatedBranch : b))
      setActiveBranch(updatedBranch)
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
        {/* Vyapar 3-inch Setup */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Printer className="w-4 h-4 text-slate-500" /> Vyapar 3-inch Print Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Print format</Label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={printFormat}
                  onChange={e => setPrintFormat(e.target.value)}
                >
                  <option value="vyapar_3inch">Vyapar 3-inch thermal</option>
                  <option value="standard_thermal">Standard thermal</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Paper width (mm)</Label>
                <Input type="number" value={paperWidthMm} onChange={e => setPaperWidthMm(Math.max(58, Number(e.target.value)))} min={58} max={90} />
              </div>
              <div className="space-y-1.5">
                <Label>Counter / terminal name</Label>
                <Input value={vyaparCounterName} onChange={e => setVyaparCounterName(e.target.value)} placeholder="Counter 1" />
              </div>
            </div>
            <p className="text-xs text-slate-400">Saved invoices use the selected thermal width for print/download.</p>
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
                    <Input value={currentBusiness?.gst_number || ''} readOnly placeholder="Set in Company Profile" className="bg-slate-50 text-slate-500" />
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
          <span className="text-xs text-slate-400">(sample data)</span>
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
          printFormat={printFormat}
          businessName={currentBusiness?.name || ''}
          gstin={currentBusiness?.gst_number || ''}
        />
      </div>
    </div>
  )
}
