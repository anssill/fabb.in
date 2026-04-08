'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { Printer, Download, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRef } from 'react'

interface ItemTagProps {
  item: {
    sku: string
    name: string
    category: string
  }
}

export function ItemTag({ item }: ItemTagProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <Card className="overflow-hidden bg-slate-50 border-dashed border-2">
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-3 rounded-xl shadow-sm border" ref={printRef}>
            <div className="text-center mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fabb Studio</p>
            </div>
            <QRCodeCanvas 
              value={item.sku} 
              size={120}
              level="H"
              includeMargin={true}
            />
            <div className="text-center mt-2">
              <p className="text-xs font-bold text-slate-900">{item.sku}</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{item.name}</p>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-1" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-2" />
              Print tag
            </Button>
          </div>
        </div>
      </CardContent>
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-tag, #printable-tag * {
            visibility: visible;
          }
          #printable-tag {
            position: absolute;
            left: 0;
            top: 0;
            width: 40mm; /* Standard tag size */
            height: 60mm;
          }
        }
      `}</style>
    </Card>
  )
}
