'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle2, ShieldAlert, Upload, Eye, XCircle } from 'lucide-react'
import { useUpdateAadhaarStatus } from '@/lib/queries/useCustomers'

interface AadhaarVerificationProps {
  customerId: string
  frontUrl?: string
  backUrl?: string
  onVerify?: () => void
}

export function AadhaarVerification({ customerId, frontUrl, backUrl }: AadhaarVerificationProps) {
  const updateStatus = useUpdateAadhaarStatus()
  const [isUploading, setIsUploading] = useState<'front' | 'back' | null>(null)

  const handleUpload = async (side: 'front' | 'back') => {
    setIsUploading(side)
    // Simulate upload - in real app, we'd use Supabase Storage
    const mockUrl = `https://storage.echo.app/ids/${customerId}_${side}.jpg`
    
    await updateStatus.mutateAsync({ customerId, url: mockUrl, side })
    setIsUploading(null)
  }

  const DocumentCard = ({ side, url }: { side: 'front' | 'back'; url?: string }) => (
    <Card className={`overflow-hidden border-2 transition-all ${url ? 'border-zinc-200 bg-white' : 'border-dashed border-zinc-200 bg-zinc-50/50'}`}>
      <CardHeader className="py-4 space-y-0.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Aadhaar Card {side}
          </CardTitle>
          {url ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="aspect-[16/10] relative flex flex-col items-center justify-center p-6 bg-zinc-100 group">
          {url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Aadhaar ${side}`} className="absolute inset-0 w-full h-full object-cover grayscale opacity-80" />
              <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="secondary" size="sm" className="h-8 shadow-xl">
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                </Button>
                <Button variant="outline" size="sm" className="h-8 bg-white/20 border-white/40 text-white hover:bg-white/40" onClick={() => handleUpload(side)}>
                  <RefreshCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-3">
              <div className="p-3 bg-white rounded-full inline-block shadow-sm">
                <Upload className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-xs font-semibold text-zinc-500">Upload {side} photo</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-4" 
                disabled={isUploading === side}
                onClick={() => handleUpload(side)}
              >
                {isUploading === side ? 'Uploading...' : 'Scan Doc'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DocumentCard side="front" url={frontUrl} />
      <DocumentCard side="back" url={backUrl} />
      
      <div className="md:col-span-2 mt-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50 flex items-start gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-800">Identity Guidelines</h4>
          <p className="text-xs leading-relaxed text-zinc-500 max-w-sm mt-0.5">
            Documents must be clear. Ensure no glare on hologram.
            Verification status affects Trust Score by <span className="text-emerald-600 font-bold">+25 pts</span>.
          </p>
        </div>
      </div>
    </div>
  )
}

function RefreshCcw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}
