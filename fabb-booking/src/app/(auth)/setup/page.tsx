'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Building2, MapPin, Users, Package, Rocket, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  { label: 'Business', icon: Building2 },
  { label: 'Branch', icon: MapPin },
  { label: 'Staff', icon: Users },
  { label: 'Inventory', icon: Package },
  { label: 'Go Live', icon: Rocket },
]

const CATEGORIES = ['Kurtha', 'Suits', 'Loafers', 'Shoes', 'Cap', 'Accessories']

function getPasswordStrength(password: string): number {
  if (password.length === 0) return 0
  if (password.length < 6) return 1
  if (password.length >= 6 && !/[0-9]/.test(password)) return 2
  if (password.length >= 8 && /[0-9]/.test(password) && !/[A-Z]/.test(password)) return 3
  if (password.length >= 8 && /[0-9]/.test(password) && /[A-Z]/.test(password)) return 4
  return 2
}

const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
const STRENGTH_LABELS = ['', 'Too short', 'Weak', 'Almost there', 'Strong']

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Step 1 — Business Details
  const [business, setBusiness] = useState({
    name: '', phone: '', email: '', address: '',
    city: '', state: '', pincode: '', gst_number: '',
    password: '', confirmPassword: '',
  })

  // Step 2 — Branch
  const [branch, setBranch] = useState({
    name: '', address: '', city: '', phone: '', prefix: '',
  })

  // Step 3 — Staff
  const [staffList, setStaffList] = useState<{ name: string; email: string; role: string }[]>([])

  // Step 4 — Inventory
  const [items, setItems] = useState<{
    name: string; category: string; sizes: string; stock: number; dailyRate: number
  }[]>([])

  const progress = ((currentStep + 1) / STEPS.length) * 100
  const passwordStrength = getPasswordStrength(business.password)

  const getStaffInfo = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: staffRecord } = await supabase
      .from('staff')
      .select('business_id, branch_id')
      .eq('id', user.id)
      .single()
    if (!staffRecord) throw new Error('Staff record not found')
    return { user, staffRecord, supabase }
  }

  const handleNext = async () => {
    setLoading(true)
    try {
      if (currentStep === 0) {
        // Validate password
        if (!business.password || business.password.length < 8) {
          toast.error('Password must be at least 8 characters')
          return
        }
        if (!/[A-Z]/.test(business.password) || !/[0-9]/.test(business.password)) {
          toast.error('Password must contain at least 1 uppercase letter and 1 number')
          return
        }
        if (business.password !== business.confirmPassword) {
          toast.error('Passwords do not match')
          return
        }

        const { staffRecord, supabase } = await getStaffInfo()

        // Update business record
        const { error: bizError } = await supabase.from('businesses').update({
          name: business.name || undefined,
          phone: business.phone || null,
          email: business.email || null,
          address: business.address || null,
          city: business.city || null,
          state: business.state || null,
          pincode: business.pincode || null,
          gst_number: business.gst_number || null,
        }).eq('id', staffRecord.business_id)

        if (bizError) throw new Error('Failed to update business details')

        // Update password via admin API route
        const res = await fetch('/api/setup/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: business.password }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error || 'Failed to update password')
        }

        setCurrentStep(1)
      } else if (currentStep === 1) {
        const { staffRecord, supabase } = await getStaffInfo()

        const { error: branchError } = await supabase.from('branches').update({
          name: branch.name || undefined,
          address: branch.address || null,
          city: branch.city || null,
          phone: branch.phone || null,
          prefix: branch.prefix ? branch.prefix.toUpperCase() : undefined,
        }).eq('id', staffRecord.branch_id)

        if (branchError) throw new Error('Failed to update branch details')

        setCurrentStep(2)
      } else if (currentStep === 2) {
        // Create staff — non-fatal, errors are shown as warnings
        const { staffRecord } = await getStaffInfo()
        const validStaff = staffList.filter((s) => s.name && s.email)

        for (const s of validStaff) {
          try {
            await fetch('/api/staff/invite', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-business-id': staffRecord.business_id,
              },
              body: JSON.stringify({
                email: s.email,
                name: s.name,
                role: s.role,
                branchId: staffRecord.branch_id,
              }),
            })
          } catch {
            // Non-fatal — skip failed staff, can add later
          }
        }

        setCurrentStep(3)
      } else if (currentStep === 3) {
        // Create inventory items — non-fatal
        const { staffRecord, supabase } = await getStaffInfo()
        const validItems = items.filter((i) => i.name)

        for (const item of validItems) {
          try {
            const sku = `${item.category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
            const { data: itemData } = await supabase
              .from('items')
              .insert({
                business_id: staffRecord.business_id,
                branch_id: staffRecord.branch_id,
                name: item.name,
                sku,
                category: item.category,
                daily_rate: item.dailyRate || 0,
                is_active: true,
              })
              .select('id')
              .single()

            if (itemData && item.sizes) {
              const sizes = item.sizes.split(',').map((s) => s.trim()).filter(Boolean)
              await supabase.from('item_variants').insert(
                sizes.map((size) => ({
                  item_id: itemData.id,
                  size,
                  total_stock: item.stock || 1,
                  available_stock: item.stock || 1,
                  reserved_stock: 0,
                  is_active: true,
                }))
              )
            }
          } catch {
            // Non-fatal — skip failed items, can add later
          }
        }

        setCurrentStep(4)
      }
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const handleSkip = () => {
    setCurrentStep(currentStep + 1)
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('staff').update({ setup_completed: true }).eq('id', user.id)
      }
      toast.success('Your workspace is ready!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const addStaff = () => {
    if (staffList.length >= 10) return
    setStaffList([...staffList, { name: '', email: '', role: 'staff' }])
  }

  const addItem = () => {
    setItems([...items, { name: '', category: 'Kurtha', sizes: 'S, M, L, XL', stock: 1, dailyRate: 0 }])
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">F</span>
          </div>
          <span className="font-semibold text-slate-900">Fabb.booking</span>
          <span className="text-slate-400 mx-2">·</span>
          <span className="text-sm text-slate-500">Setup</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 h-1">
        <div
          className="bg-blue-600 h-1 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="max-w-2xl mx-auto px-6 pt-8">
        <div className="flex justify-between mb-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isActive = i === currentStep
            const isDone = i < currentStep
            return (
              <div key={step.label} className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isDone
                      ? 'bg-blue-600 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <Card className="shadow-sm">
          {/* Step 1: Business Details */}
          {currentStep === 0 && (
            <>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>Complete your business profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Business name</Label>
                    <Input
                      value={business.name}
                      onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                      placeholder="Raj Bridal Collections"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={business.phone}
                      onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={business.email}
                      onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                      placeholder="you@business.com"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Address</Label>
                    <textarea
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={business.address}
                      onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={business.city}
                      onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={business.state}
                      onChange={(e) => setBusiness({ ...business, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input
                      value={business.pincode}
                      onChange={(e) => setBusiness({ ...business, pincode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GST Number <span className="text-slate-400">(optional)</span></Label>
                    <Input
                      value={business.gst_number}
                      onChange={(e) => setBusiness({ ...business, gst_number: e.target.value })}
                      placeholder="22AAABB1234A1Z5"
                      maxLength={15}
                    />
                  </div>

                  {/* Password section */}
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <p className="text-sm font-medium text-slate-700 mb-3">Set your password</p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPass ? 'text' : 'password'}
                        value={business.password}
                        onChange={(e) => setBusiness({ ...business, password: e.target.value })}
                        placeholder="Min 8 characters"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {business.password.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i <= passwordStrength ? STRENGTH_COLORS[passwordStrength] : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${passwordStrength === 4 ? 'text-green-600' : 'text-slate-500'}`}>
                          {STRENGTH_LABELS[passwordStrength]} — Min 8 characters, 1 uppercase, 1 number
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Confirm password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        value={business.confirmPassword}
                        onChange={(e) => setBusiness({ ...business, confirmPassword: e.target.value })}
                        placeholder="Repeat your password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {business.confirmPassword.length > 0 && business.password !== business.confirmPassword && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                    {business.confirmPassword.length > 0 && business.password === business.confirmPassword && business.password.length > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Passwords match
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Branch Setup */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle>Tell us about your store location</CardTitle>
                <CardDescription>This becomes your main branch in Fabb.booking.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Branch name</Label>
                  <Input
                    value={branch.name}
                    onChange={(e) => setBranch({ ...branch, name: e.target.value })}
                    placeholder="Main Store - Thrissur"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full address</Label>
                  <textarea
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={branch.address}
                    onChange={(e) => setBranch({ ...branch, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={branch.city}
                      onChange={(e) => setBranch({ ...branch, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={branch.phone}
                      onChange={(e) => setBranch({ ...branch, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Booking ID prefix (3 letters)</Label>
                  <Input
                    value={branch.prefix}
                    onChange={(e) => setBranch({ ...branch, prefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) })}
                    placeholder="TRT"
                    maxLength={3}
                  />
                  <p className="text-xs text-slate-400">
                    Your booking IDs will look like: {branch.prefix || 'TRT'}-260326-001
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Staff */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle>Who works with you?</CardTitle>
                <CardDescription>Add your staff. They&apos;ll receive login credentials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {staffList.map((s, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={s.name}
                        onChange={(e) => {
                          const updated = [...staffList]
                          updated[i] = { ...updated[i], name: e.target.value }
                          setStaffList(updated)
                        }}
                        placeholder="Staff name"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        value={s.email}
                        onChange={(e) => {
                          const updated = [...staffList]
                          updated[i] = { ...updated[i], email: e.target.value }
                          setStaffList(updated)
                        }}
                        placeholder="staff@email.com"
                      />
                    </div>
                    <div className="w-32 space-y-1">
                      <Label className="text-xs">Role</Label>
                      <Select
                        value={s.role}
                        onValueChange={(v) => {
                          const updated = [...staffList]
                          updated[i] = { ...updated[i], role: v }
                          setStaffList(updated)
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 shrink-0"
                      onClick={() => setStaffList(staffList.filter((_, idx) => idx !== i))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addStaff} disabled={staffList.length >= 10}>
                  + Add staff member
                </Button>
                <p className="text-xs text-slate-400">Staff can be added later from Settings → Staff</p>
              </CardContent>
            </>
          )}

          {/* Step 4: Inventory */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle>Add some items to get started</CardTitle>
                <CardDescription>Add a few items from your collection. You can add more later.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 items-end">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Item name</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...items]
                          updated[i] = { ...updated[i], name: e.target.value }
                          setItems(updated)
                        }}
                        placeholder="Red Silk Kurtha"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Category</Label>
                      <Select
                        value={item.category}
                        onValueChange={(v) => {
                          const updated = [...items]
                          updated[i] = { ...updated[i], category: v }
                          setItems(updated)
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sizes</Label>
                      <Input
                        value={item.sizes}
                        onChange={(e) => {
                          const updated = [...items]
                          updated[i] = { ...updated[i], sizes: e.target.value }
                          setItems(updated)
                        }}
                        placeholder="S, M, L"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">₹/day</Label>
                      <Input
                        type="number"
                        value={item.dailyRate || ''}
                        onChange={(e) => {
                          const updated = [...items]
                          updated[i] = { ...updated[i], dailyRate: Number(e.target.value) }
                          setItems(updated)
                        }}
                        placeholder="500"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem}>
                  + Add item
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 5: All Set */}
          {currentStep === 4 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">You&apos;re ready to go!</CardTitle>
                <CardDescription>Your Fabb.booking workspace is set up.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Business profile complete</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Main branch configured{branch.name ? `: ${branch.name}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{staffList.length} team member{staffList.length !== 1 ? 's' : ''} added</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{items.length} item{items.length !== 1 ? 's' : ''} added</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">Your 14-day free trial started today.</p>
                  <p className="text-xs text-blue-600 mt-1">No credit card required. Cancel anytime.</p>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between py-6">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0 || loading}>
            Back
          </Button>
          <div className="flex gap-2">
            {currentStep >= 2 && currentStep < 4 && (
              <Button variant="ghost" onClick={handleSkip} className="text-slate-400" disabled={loading}>
                Skip for now
              </Button>
            )}
            {currentStep < 4 ? (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleNext} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Next →
              </Button>
            ) : (
              <Button
                className="bg-blue-600 hover:bg-blue-700 w-48"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Go to Dashboard →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
