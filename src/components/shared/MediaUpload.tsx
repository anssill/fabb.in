'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, ImageIcon, AlertCircle, Camera } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { toast } from 'sonner'

interface ImageUploadProps {
  bucket: string
  path: string
  onUploadComplete: (url: string) => void
  onRemove?: ((url: string) => void) | (() => void)
  value?: string | string[]
  label?: string
  className?: string
  maxSizeMB?: number
  multiple?: boolean
  enableCameraCapture?: boolean
}

export function MediaUpload({
  bucket,
  path,
  onUploadComplete,
  onRemove,
  value,
  label,
  className = '',
  maxSizeMB = 1,
  multiple = false,
  enableCameraCapture = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
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

        // 2. Upload through the server so staff uploads are not blocked by storage RLS.
        const formData = new FormData()
        formData.append('bucket', bucket)
        formData.append('path', path)
        formData.append('file', fileToUpload)

        const response = await fetch('/api/uploads/media', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.error || 'Failed to upload image')

        onUploadComplete(data.publicUrl)
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
              ;(onRemove as (url: string) => void)(url)
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
              {enableCameraCapture && (
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? [])
                    event.target.value = ''
                    onDrop(files)
                  }}
                />
              )}
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
                  {enableCameraCapture && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-2"
                      onClick={(event) => {
                        event.stopPropagation()
                        cameraInputRef.current?.click()
                      }}
                    >
                      <Camera className="w-4 h-4" />
                      Take photo
                    </Button>
                  )}
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
