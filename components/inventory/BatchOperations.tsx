import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Upload, Barcode, Pencil, CheckCircle2 } from 'lucide-react'
import Papa from 'papaparse'
import { useCreateItem, useBulkUpdateItems, InventoryItem } from '@/lib/queries/useItems'

interface Props {
  selectedItems: InventoryItem[]
  clearSelection: () => void
}

export function BatchOperations({ selectedItems, clearSelection }: Props) {
  const { mutateAsync: createItem } = useCreateItem()
  const { mutateAsync: bulkUpdate } = useBulkUpdateItems()
  const [isImporting, setIsImporting] = useState(false)

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          for (const row of results.data as Record<string, string>[]) {
            const generatedSku = `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
            await createItem({
              name: row.Name || 'Imported Item',
              category: row.Category || 'Uncategorized',
              price: Number(row.Price) || 0,
              sub_category: row.SubCategory || '',
              sku: generatedSku,
              status: 'available',
              condition_grade: 'A',
            })
          }
          alert(`Successfully imported ${results.data.length} items.`)
        } catch (error) {
          console.error(error)
          alert('Error importing items. Please check the console.')
        } finally {
          setIsImporting(false)
          e.target.value = ''
        }
      },
    })
  }

  const handleBulkStatusChange = async (status: string) => {
    if (!selectedItems.length) return
    if (!confirm(`Update ${selectedItems.length} items to "${status}"?`)) return

    await bulkUpdate({
      ids: selectedItems.map((i) => i.id),
      updates: { status },
    })
    alert('Statuses updated!')
    clearSelection()
  }

  const handleBulkQRPrint = () => {
    if (!selectedItems.length) return

    const newWindow = window.open('', '_blank')
    if (!newWindow) return

    const qrHtml = selectedItems
      .map(
        (item) => `
      <div style="width:68mm;min-height:40mm;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;border:2px solid #ddd;margin-bottom:20px;text-align:center;page-break-after:always;padding:10px;box-sizing:border-box;">
        <h2 style="margin:0 0 10px;font-size:16px;">${item.sku}</h2>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${item.sku}" style="width:80px;height:80px;" />
        <p style="font-size:10px;font-weight:bold;margin:10px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${item.name}</p>
        <p style="font-size:8px;margin:5px 0 0;">ECHO RENTALS</p>
      </div>
    `
      )
      .join('')

    newWindow.document.write(`
      <html>
        <head><title>Print Batch QRs</title>
          <style>@media print{@page{margin:0}body{margin:0}}</style>
        </head>
        <body onload="window.print();window.close();">${qrHtml}</body>
      </html>
    `)
    newWindow.document.close()
    clearSelection()
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 shadow-sm">
      {/* CSV Import */}
      <div className="relative">
        <input
          type="file"
          accept=".csv"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleCsvImport}
          disabled={isImporting}
        />
        <Button variant="outline" className="gap-2 pointer-events-none">
          <Upload className="w-4 h-4" />
          {isImporting ? 'Importing...' : 'CSV Import'}
        </Button>
      </div>

      <a
        href="data:text/csv;charset=utf-8,Name,Category,SubCategory,Price%0AExample Item,Bridal,Lehenga,15000"
        download="template.csv"
      >
        <Button variant="ghost" size="sm" className="gap-2 text-zinc-500">
          <Download className="w-4 h-4" /> Template
        </Button>
      </a>

      {/* Selected Operations */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 ml-auto border-l pl-4 border-zinc-300 dark:border-zinc-700">
          <span className="text-sm font-semibold text-zinc-600 mr-2">
            {selectedItems.length} selected
          </span>
          <Button variant="secondary" size="sm" onClick={handleBulkQRPrint} className="gap-2">
            <Barcode className="w-4 h-4" /> Print QRs
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleBulkStatusChange('maintenance')}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" /> Set Maintenance
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleBulkStatusChange('available')}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Set Available
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection} className="text-red-500 hover:text-red-600">
            Clear
          </Button>
        </div>
      )}
    </div>
  )
}
