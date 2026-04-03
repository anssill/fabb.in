import { useState, useCallback } from 'react'
import { useBulkCreateItems, InventoryItem } from '@/lib/queries/useItems'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'sonner'

export function BulkImportModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<any[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const { mutateAsync: bulkCreate } = useBulkCreateItems()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) processFile(selected)
  }

  const processFile = (file: File) => {
    setFile(file)
    setIsParsing(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data)
        setIsParsing(false)
        console.log('Parsed:', results.data)
      },
      error: (err) => {
        toast.error('Failed to parse CSV')
        setIsParsing(false)
      }
    })
  }

  const handleImport = async () => {
    if (data.length === 0) return
    setIsImporting(true)
    try {
      // Map basic fields to the InventoryItem schema
      const itemsToCreate = data.map((row: any) => ({
        name: row.Name || row.name,
        category: row.Category || row.category || 'Uncategorized',
        price: Number(row.Price || row.price || 0),
        deposit_pct: Number(row['Deposit %'] || row.deposit_pct || 100),
        sku: row.SKU || row.sku || `BULK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: 'available',
        condition_grade: 'A'
      }))

      await bulkCreate(itemsToCreate)
      toast.success(`Successfully imported ${itemsToCreate.length} items`)
      reset()
    } catch (e: any) {
      toast.error(e.message || 'Failed to import items')
    } finally {
      setIsImporting(false)
    }
  }

  const reset = () => {
    setIsOpen(false)
    setTimeout(() => {
      setFile(null)
      setData([])
      setIsImporting(false)
    }, 200)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(val) => {
      if (!val) reset()
      else setIsOpen(true)
    }}>
      <SheetTrigger render={
        <Button variant="outline" className="h-10 px-5 rounded-lg border-zinc-200 dark:border-zinc-800 gap-2 text-zinc-900">
          <Upload className="w-4 h-4 text-zinc-500" />
          Bulk Import
        </Button>
      }>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-white border-zinc-200">
        <SheetHeader>
          <SheetTitle>Bulk Import Inventory</SheetTitle>
          <SheetDescription>
            Upload a CSV file to add multiple items at once.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Info Section */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-semibold uppercase tracking-wider">Required Columns</p>
              <p>Name, Category, Price, SKU (Optional)</p>
            </div>
          </div>

          {/* Upload Zone */}
          <div 
            className={`
              relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-10 transition-all
              ${file ? 'border-emerald-200 bg-emerald-50/30' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}
            `}
          >
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
            
            {file ? (
              <>
                <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-3" />
                <p className="font-medium text-emerald-700">{file.name}</p>
                <p className="text-xs text-emerald-600 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="font-medium text-zinc-900">Click to upload CSV</p>
                <p className="text-xs text-zinc-500 mt-1">Drag and drop also supported</p>
              </>
            )}
          </div>

          {/* Data Preview */}
          {data.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Ready to Import
                </h4>
                <Badge variant="secondary" className="font-mono">{data.length} Rows</Badge>
              </div>
              <div className="max-h-[200px] overflow-auto border rounded-xl divide-y">
                {data.slice(0, 5).map((row, i) => (
                  <div key={i} className="p-3 text-xs flex justify-between gap-4">
                    <span className="font-medium truncate">{row.Name || row.name || 'Untitled'}</span>
                    <span className="text-zinc-500 font-mono">₹{row.Price || row.price || 0}</span>
                  </div>
                ))}
                {data.length > 5 && (
                  <div className="p-2 text-center text-[10px] text-zinc-400 font-medium bg-zinc-50/50">
                    + {data.length - 5} more rows...
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
             <Button variant="ghost" className="flex-1" onClick={reset}>Cancel</Button>
             <Button 
                className="flex-1 bg-zinc-900 text-white gap-2 font-bold disabled:opacity-50"
                disabled={!file || data.length === 0 || isImporting || isParsing}
                onClick={handleImport}
             >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    Start Import
                  </>
                )}
             </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
