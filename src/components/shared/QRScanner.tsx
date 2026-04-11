'use client'

import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanError?: (errorMessage: string) => void
  onClose: () => void
  isOpen: boolean
}

export function QRScanner({ onScanSuccess, onScanError, onClose, isOpen }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      },
      false
    )

    scanner.render(
      (decodedText) => {
        // Stop scanning on success to prevent multiple reads
        scanner.clear().then(() => {
          onScanSuccess(decodedText)
          onClose()
        })
      },
      (errorMessage) => {
        if (onScanError) onScanError(errorMessage)
      }
    )

    scannerRef.current = scanner

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.error('Failed to clear scanner on unmount', error)
        })
      }
    }
  }, [isOpen, onScanSuccess, onScanError, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-800">Scan Item Tag</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scanner Body */}
        <div className="p-6">
          <div id="qr-reader" className="w-full !border-none overflow-hidden rounded-xl bg-slate-100 min-h-[300px]" />
          
          <div className="mt-6 text-center text-sm text-slate-500">
            <p>Align the item QR code within the frame above</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t flex justify-center">
          <p className="text-xs text-slate-400">Powered by Fabb AI Scan Engine</p>
        </div>
      </div>
    </div>
  )
}
