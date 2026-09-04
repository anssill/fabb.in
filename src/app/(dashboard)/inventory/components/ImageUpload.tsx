'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string | null
  onChange: (file: File | null, previewUrl?: string | null) => void
  disabled?: boolean
  className?: string
}

export function ImageUpload({ value, onChange, disabled, className = '' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isCompressing, setIsCompressing] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Compress the file
    setIsCompressing(true)
    try {
      const options = {
        maxSizeMB: 1, // Max 1MB
        maxWidthOrHeight: 1200, // Reasonable max dimension
        useWebWorker: true
      }
      
      const compressedFile = await imageCompression(file, options)
      
      // Create local preview URL
      const previewUrl = URL.createObjectURL(compressedFile)
      setPreview(previewUrl)
      
      // Notify parent component
      onChange(compressedFile, previewUrl)
    } catch (error) {
      console.error('Error compressing image:', error)
      toast.error('Failed to process image. please try another one.')
    } finally {
      setIsCompressing(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: disabled || isCompressing
  })

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering dropzone
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    onChange(null, null)
  }

  return (
    <div className={`space-y-4 w-full ${className}`}>
      {preview ? (
        <div className="relative w-full aspect-video sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-auto lg:h-[250px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group">
          <Image
            src={preview}
            alt="Upload preview"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                type="button" 
                variant="destructive" 
                size="sm" 
                onClick={clearImage}
                className="gap-2"
              >
                <X className="w-4 h-4" /> Remove Image
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
            ${disabled || isCompressing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-3">
            {isCompressing ? (
              <>
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full animate-pulse">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-700">Processing image...</p>
                </div>
              </>
            ) : (
              <>
                <div className={`p-3 rounded-full ${isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  {isDragActive ? <Upload className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-700">
                    {isDragActive ? 'Drop image here' : 'Click or drag image to upload'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports JPG, PNG, WEBP (Max 5MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
