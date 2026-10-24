'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import { Upload, X, Image as ImageIcon, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'
import { Input } from '@/components/ui/input'

interface ImageUploadProps {
  value?: string | null
  onChange: (file: File | null, previewUrl?: string | null) => void
  disabled?: boolean
  className?: string
  editable?: boolean
}

export function ImageUpload({ value, onChange, disabled, className = '', editable = false }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [cropX, setCropX] = useState(50)
  const [cropY, setCropY] = useState(50)
  const [zoom, setZoom] = useState(100)
  const [outputWidth, setOutputWidth] = useState(1200)

  useEffect(() => {
    setPreview(value || null)
  }, [value])

  useEffect(() => {
    if (!preview?.startsWith('blob:')) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Compress the file
    setIsCompressing(true)
    try {
      const processedFile = editable ? file : await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
      const previewUrl = URL.createObjectURL(processedFile)
      setPreview(previewUrl)
      
      // Notify parent component
      onChange(processedFile, previewUrl)
    } catch (error) {
      console.error('Error compressing image:', error)
      toast.error('Failed to process image. please try another one.')
    } finally {
      setIsCompressing(false)
    }
  }, [editable, onChange])

  const applyEdits = async () => {
    if (!preview) return
    setIsCompressing(true)
    try {
      const image = new window.Image()
      image.src = preview
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Could not read image')) })
      const scale = Math.min(1, outputWidth / image.naturalWidth)
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Image editing is unavailable in this browser')
      ctx.translate(width / 2, height / 2)
      ctx.scale(zoom / 100, zoom / 100)
      ctx.translate(-(cropX / 100) * width, -(cropY / 100) * height)
      ctx.drawImage(image, 0, 0, width, height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      if (!blob) throw new Error('Could not create edited image')
      const file = new File([blob], 'inventory-photo.jpg', { type: 'image/jpeg' })
      const url = URL.createObjectURL(file)
      setPreview(url)
      onChange(file, url)
      toast.success('Photo crop and size applied')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not edit photo')
    } finally {
      setIsCompressing(false)
    }
  }

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
    setPreview(null)
    onChange(null, null)
  }

  return (
    <div className={`space-y-4 w-full ${className}`}>
      {preview ? (
        <div className="relative w-full aspect-video sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-auto lg:h-[250px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group">
          <Image unoptimized
            src={preview}
            alt="Upload preview"
            fill
            className="object-cover"
            style={editable ? { objectPosition: `${cropX}% ${cropY}%`, transform: `scale(${zoom / 100})` } : { objectFit: 'contain' }}
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
      {editable && preview && (
        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium">Adjust inventory photo</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">Crop horizontally <input aria-label="Crop horizontally" type="range" min="0" max="100" value={cropX} onChange={(e) => setCropX(Number(e.target.value))} className="block w-full" /></label>
            <label className="space-y-1 text-xs text-muted-foreground">Crop vertically <input aria-label="Crop vertically" type="range" min="0" max="100" value={cropY} onChange={(e) => setCropY(Number(e.target.value))} className="block w-full" /></label>
            <label className="space-y-1 text-xs text-muted-foreground">Zoom <input aria-label="Zoom photo" type="range" min="100" max="250" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="block w-full" /></label>
            <label className="space-y-1 text-xs text-muted-foreground">Output width (px)<Input aria-label="Output width in pixels" type="number" min="320" max="2400" step="80" value={outputWidth} onChange={(e) => setOutputWidth(Math.min(2400, Math.max(320, Number(e.target.value) || 320)))} className="h-8" /></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={applyEdits} disabled={disabled || isCompressing}>{isCompressing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Apply crop & size</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setCropX(50); setCropY(50); setZoom(100); setOutputWidth(1200) }} disabled={disabled}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button>
          </div>
        </div>
      )}
    </div>
  )
}
