'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Building2, Save } from 'lucide-react'

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

export function CompanySettingsClient() {
  const { business, setBusiness } = useAppStore()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo')
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove logo')
    } finally {
      setIsUploading(false)
    }
  }

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

  // Set default values when business data is available
  useEffect(() => {
    if (business) {
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
    }
  }, [business, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!business) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
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
        })
        .eq('id', business.id)

      if (error) throw error

      setBusiness({ ...business, ...values, email: values.email || null, phone: values.phone || null, address: values.address || null, city: values.city || null, state: values.state || null, pincode: values.pincode || null, gst_number: values.gst_number || null, pan_number: values.pan_number || null })
      toast.success('Company profile updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update company profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!business) {
    return <div className="h-40 flex items-center justify-center text-sm text-slate-500">Loading company profile...</div>
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden relative">
                {business.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={business.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-400" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">Company Logo</p>
                <div className="flex gap-2 items-center">
                  <input type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} />
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload New Logo'}
                  </Button>
                  {business.logo_url && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleRemoveLogo} disabled={isUploading}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Raj Bridal Collections" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Market Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Thrissur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Kerala" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input placeholder="680001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INR">₹ INR - Indian Rupee</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100 flex gap-4">
                <FormField
                  control={form.control}
                  name="gst_number"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pan_number"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? 'Saving...' : <><Save className="w-4 h-4 mr-2"/> Save company profile</>}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
