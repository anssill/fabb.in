'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, Download, AlertTriangle, CheckCircle2, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const CSV_HEADERS = ['name', 'category', 'sku', 'price', 'deposit_amount', 'size', 'stock', 'storage_location', 'condition']
const VALID_CATEGORIES = ['kurtha', 'suits', 'loafers', 'shoes', 'cap', 'accessories']
const VALID_CONDITIONS = ['excellent', 'good', 'fair', 'poor']

interface ParsedRow {
  name: string
  category: string
  sku: string
  price: number
  deposit_amount: number
  size: string
  stock: number
  storage_location: string
  condition: string
  errors: string[]
}

function downloadTemplate() {
  const header = CSV_HEADERS.join(',')
  const sample = [
    'Silk Kurtha Set,kurtha,KU-001,500,1000,M,2,Rack A Shelf 1,good',
    'Navy Suit,suits,SU-001,800,2000,42,1,Rack B Shelf 2,excellent',
    'Brown Loafers,loafers,LO-001,300,500,8,3,Shoe Rack 1,good',
  ].join('\n')
  const csv = `${header}\n${sample}`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fabb_inventory_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    header.forEach((h, idx) => { row[h] = values[idx] ?? '' })

    const errors: string[] = []

    if (!row.name?.trim()) errors.push('Name is required')
    if (!VALID_CATEGORIES.includes(row.category?.toLowerCase())) {
      errors.push(`Invalid category. Use: ${VALID_CATEGORIES.join(', ')}`)
    }
    if (!row.size?.trim()) errors.push('Size is required')

    const price = parseFloat(row.price)
    if (isNaN(price) || price <= 0) errors.push('Price must be a positive number')

    const deposit = parseFloat(row.deposit_amount)
    if (isNaN(deposit) || deposit < 0) errors.push('Deposit must be 0 or more')

    const stock = parseInt(row.stock)
    if (isNaN(stock) || stock < 0) errors.push('Stock must be 0 or more')

    const condition = row.condition?.toLowerCase() || 'good'
    if (!VALID_CONDITIONS.includes(condition)) errors.push(`Invalid condition. Use: ${VALID_CONDITIONS.join(', ')}`)

    rows.push({
      name: row.name?.trim(),
      category: row.category?.toLowerCase(),
      sku: row.sku?.trim() || '',
      price: isNaN(price) ? 0 : price,
      deposit_amount: isNaN(deposit) ? 0 : deposit,
      size: row.size?.trim(),
      stock: isNaN(stock) ? 0 : stock,
      storage_location: row.storage_location?.trim() || '',
      condition,
      errors,
    })
  }

  return rows
}

export function CsvImportDialog() {
  const router = useRouter()
  const { staff, activeBranch } = useAppStore()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const validRows = rows.filter((r) => r.errors.length === 0)
  const invalidRows = rows.filter((r) => r.errors.length > 0)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCsv(text)
      setRows(parsed)
      setImportResult(null)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!staff || !activeBranch || validRows.length === 0) return
    setImporting(true)
    let success = 0
    let failed = 0

    const supabase = createClient()

    for (const row of validRows) {
      try {
        // 1. Create item
        const { data: item, error: itemErr } = await supabase
          .from('items')
          .insert({
            business_id: staff.business_id,
            branch_id: activeBranch.id,
            name: row.name,
            category: row.category,
            sku: row.sku || null,
            price: row.price,
            deposit_amount: row.deposit_amount,
            storage_location: row.storage_location || null,
            condition: row.condition,
            status: 'available',
            is_active: true,
          })
          .select('id')
          .single()

        if (itemErr || !item) { failed++; continue }

        // 2. Create variant
        const { error: variantErr } = await supabase
          .from('item_variants')
          .insert({
            item_id: item.id,
            business_id: staff.business_id,
            size: row.size,
            total_stock: row.stock,
            available_stock: row.stock,
            reserved_stock: 0,
          })

        if (variantErr) { failed++; continue }

        success++
      } catch {
        failed++
      }
    }

    setImportResult({ success, failed })
    setImporting(false)

    if (success > 0) {
      toast.success(`Imported ${success} items successfully`)
      router.refresh()
    }
    if (failed > 0) {
      toast.error(`${failed} items failed to import`)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setRows([])
    setImportResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Inventory from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Step 1: Download template */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-blue-900">Step 1: Download the template</p>
              <p className="text-xs text-blue-600 mt-0.5">Fill in your items and re-upload below</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="shrink-0">
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
          </div>

          {/* Step 2: Upload file */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Step 2: Upload filled CSV</p>
            <label
              className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <span className="text-sm text-slate-500">Click to upload CSV file</span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          </div>

          {/* Preview table */}
          {rows.length > 0 && !importResult && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">
                  Preview ({rows.length} rows)
                </p>
                <div className="flex gap-2 text-xs">
                  <span className="text-green-600 font-medium">{validRows.length} valid</span>
                  {invalidRows.length > 0 && (
                    <span className="text-red-600 font-medium">{invalidRows.length} errors</span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Category</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">SKU</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Size</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Price</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className={row.errors.length > 0 ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2">
                          {row.errors.length === 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="group relative">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <div className="absolute left-6 top-0 z-10 hidden group-hover:block bg-red-800 text-white text-xs rounded p-2 w-48">
                                {row.errors.join('; ')}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">{row.name}</td>
                        <td className="px-3 py-2 capitalize">{row.category}</td>
                        <td className="px-3 py-2 font-mono text-slate-500">{row.sku || '—'}</td>
                        <td className="px-3 py-2">{row.size}</td>
                        <td className="px-3 py-2">₹{row.price}</td>
                        <td className="px-3 py-2">{row.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <p className="text-xs text-slate-400 text-center py-2">
                    Showing first 50 of {rows.length} rows
                  </p>
                )}
              </div>

              {invalidRows.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800 font-medium">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {invalidRows.length} rows have errors and will be skipped. Only {validRows.length} valid rows will be imported.
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleImport}
                  disabled={validRows.length === 0 || importing}
                >
                  {importing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                  ) : (
                    <>Import {validRows.length} Items</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Result */}
          {importResult && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="text-base font-semibold text-green-900">Import Complete</p>
                <div className="flex justify-center gap-4 mt-2 text-sm">
                  <span className="text-green-700 font-medium">{importResult.success} items imported</span>
                  {importResult.failed > 0 && (
                    <span className="text-red-600 font-medium">{importResult.failed} failed</span>
                  )}
                </div>
              </div>
              <Button className="w-full" onClick={handleClose}>Close</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
