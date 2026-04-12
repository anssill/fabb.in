'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, ImageIcon, AlertCircle } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { toast } from 'sonner'

interface ImageUploadProps {
  bucket: string
  path: string
  onUploadComplete: (url: string) => void
  onRemove?: (url?: string) => void
  value?: string | string[]
  label?: string
  className?: string
  maxSizeMB?: number
  multiple?: boolean
}

export function ImageUpload({
  bucket,
  path,
  onUploadComplete,
  onRemove,
  value,
  label,
  className = '',
  maxSizeMB = 1,
  multiple = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Process files one by one (or in parallel)
      for (const file of acceptedFiles) {
        // 1. Compress image
        const options = {
          maxSizeMB: maxSizeMB,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        }
        
        let fileToUpload = file
        if (file.type.startsWith('image/')) {
          try {
            fileToUpload = await imageCompression(file, options)
          } catch (err) {
            console.warn('Compression failed, uploading original', err)
          }
        }

        // 2. Upload to Supabase
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `${path}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileToUpload)

        if (uploadError) throw uploadError

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        onUploadComplete(publicUrl)
      }
      
      toast.success(acceptedFiles.length > 1 ? 'Images uploaded successfully' : 'Image uploaded successfully')
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image')
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }, [bucket, path, onUploadComplete, maxSizeMB])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: multiple ? 10 : 1,
    disabled: uploading
  })

  const renderImage = (url: string) => (
    <div key={url} className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={url} 
        alt="Uploaded" 
        className="w-full h-full object-contain"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {onRemove && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation()
              onRemove(url)
            }}
            className="bg-red-500/90 hover:bg-red-600"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
    </div>
  )

  const values = Array.isArray(value) ? value : (value ? [value] : [])

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-700 block">{label}</label>}
      
      <div className="space-y-4">
        {/* Gallery for multiple images */}
        {multiple && values.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {values.map(renderImage)}
          </div>
        )}

        {/* Upload Area */}
        {(!multiple && values.length > 0) ? (
          renderImage(values[0])
        ) : (
          <div className="relative">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer flex flex-col items-center justify-center text-center
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                ${error ? 'border-red-300 bg-red-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                  <p className="text-sm text-slate-600 font-medium">Uploading and processing...</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    {multiple ? <ImageIcon className="w-6 h-6 text-slate-400" /> : <Upload className="w-6 h-6 text-slate-400" />}
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    {isDragActive ? 'Drop here' : (multiple ? 'Add photos' : 'Click or drop image')}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP up to {maxSizeMB}MB</p>
                </>
              )}
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

