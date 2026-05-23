'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Building2, ImageUp, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.string().optional().or(z.literal('')),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  gst_number: z.string().optional().or(z.literal('')),
  pan_number: z.string().optional().or(z.literal('')),
})

const inputClass = 'h-11 rounded-2xl border-slate-100 bg-slate-50 shadow-none focus-visible:ring-[#4f46e5]'
const selectClass = 'h-11 rounded-2xl border-slate-100 bg-slate-50 shadow-none focus:ring-[#4f46e5]'

export function CompanySettingsClient() {
  const { business, setBusiness } = useAppStore()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      gst_number: '',
      pan_number: '',
    },
  })

  useEffect(() => {
    if (!business) return

    form.reset({
      name: business.name || '',
      email: business.email || '',
      phone: business.phone || '',
      address: business.address || '',
      city: business.city || '',
      state: business.state || '',
      pincode: business.pincode || '',
      country: business.country || 'India',
      currency: business.currency || 'INR',
      timezone: business.timezone || 'Asia/Kolkata',
      gst_number: business.gst_number || '',
      pan_number: business.pan_number || '',
    })
  }, [business, form])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !business) return

    setIsUploading(true)
    try {
      const { StorageService } = await import('@/lib/storage-service')
      const logoUrl = await StorageService.uploadCompanyLogo(business.id, file)

      const { error } = await supabase
        .from('businesses')
        .update({ logo_url: logoUrl })
        .eq('id', business.id)

      if (error) throw error

      setBusiness({ ...business, logo_url: logoUrl })
      toast.success('Logo uploaded successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveLogo() {
    if (!business?.logo_url) return

    setIsUploading(true)
    try {
      const { StorageService } = await import('@/lib/storage-service')
      await StorageService.deleteImage(business.logo_url)

      const { error } = await supabase
        .from('businesses')
        .update({ logo_url: null })
        .eq('id', business.id)

      if (error) throw error

      setBusiness({ ...business, logo_url: null })
      toast.success('Logo removed successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove logo')
    } finally {
      setIsUploading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!business) return

    setIsLoading(true)
    try {
      const nextBusiness = {
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        pincode: values.pincode || null,
        country: values.country,
        currency: values.currency,
        timezone: values.timezone,
        gst_number: values.gst_number || null,
        pan_number: values.pan_number || null,
      }

      const { error } = await supabase
        .from('businesses')
        .update(nextBusiness)
        .eq('id', business.id)

      if (error) throw error

      setBusiness({ ...business, ...nextBusiness })
      toast.success('Company profile updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update company profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!business) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[1.65rem] bg-white text-sm text-slate-500 shadow-sm">
        Loading company profile...
      </div>
    )
  }

  return (
    <Card className="rounded-[1.65rem] border-0 bg-white shadow-sm ring-0">
      <CardContent className="p-5 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-6 flex flex-col gap-4 rounded-[1.35rem] bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  {business.logo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={business.logo_url} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <Building2 className="h-8 w-8 text-slate-400" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4f46e5] border-t-transparent" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Company Logo</p>
                  <p className="mt-1 text-xs text-slate-500">Used on invoices and workspace branding.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <input type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} />
                <Button type="button" variant="outline" size="sm" className="h-9 rounded-full border-white bg-white text-xs shadow-sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <ImageUp className="mr-2 h-3.5 w-3.5" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
                {business.logo_url && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 rounded-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleRemoveLogo} disabled={isUploading}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField control={form.control} name="name" label="Business Name *" placeholder="e.g. Raj Bridal Collections" className="md:col-span-2" />
              <TextField control={form.control} name="email" label="Email Address" placeholder="contact@example.com" type="email" />
              <TextField control={form.control} name="phone" label="Phone Number" placeholder="+91 98765 43210" />
              <TextField control={form.control} name="address" label="Address" placeholder="123 Market Street" className="md:col-span-2" />
              <TextField control={form.control} name="city" label="City" placeholder="Thrissur" />
              <TextField control={form.control} name="state" label="State" placeholder="Kerala" />
              <TextField control={form.control} name="pincode" label="Pincode" placeholder="680001" />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectClass}>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="India">India</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectClass}>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INR">Rs INR - Indian Rupee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectClass}>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-1 grid gap-4 border-t border-slate-100 pt-4 md:col-span-2 md:grid-cols-2">
                <TextField control={form.control} name="gst_number" label="GST Number" placeholder="Optional" />
                <TextField control={form.control} name="pan_number" label="PAN Number" placeholder="Optional" />
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <Button type="submit" className="h-11 rounded-full bg-[#4f46e5] px-5 text-white hover:bg-[#4338ca]" disabled={isLoading}>
                {isLoading ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save company profile</>}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function TextField({
  control,
  name,
  label,
  placeholder,
  type = 'text',
  className = '',
}: {
  control: ReturnType<typeof useForm<z.infer<typeof formSchema>>>['control']
  name: keyof z.infer<typeof formSchema>
  label: string
  placeholder: string
  type?: string
  className?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input className={inputClass} placeholder={placeholder} type={type} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
