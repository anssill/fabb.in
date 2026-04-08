'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Building2, MapPin, Users, Package, Rocket, Loader2 } from 'lucide-react'
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

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

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

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
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
                    <Input value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} placeholder="Raj Bridal Collections" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} />
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
                    <Input value={business.city} onChange={(e) => setBusiness({ ...business, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={business.state} onChange={(e) => setBusiness({ ...business, state: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input value={business.pincode} onChange={(e) => setBusiness({ ...business, pincode: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>GST Number <span className="text-slate-400">(optional)</span></Label>
                    <Input value={business.gst_number} onChange={(e) => setBusiness({ ...business, gst_number: e.target.value })} placeholder="22AAABB1234A1Z5" maxLength={15} />
                  </div>
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <p className="text-sm font-medium text-slate-700 mb-3">Set your password</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={business.password} onChange={(e) => setBusiness({ ...business, password: e.target.value })} placeholder="Min 8 characters" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm password</Label>
                    <Input type="password" value={business.confirmPassword} onChange={(e) => setBusiness({ ...business, confirmPassword: e.target.value })} />
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
                  <Input value={branch.name} onChange={(e) => setBranch({ ...branch, name: e.target.value })} placeholder="Main Store - Thrissur" />
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
                    <Input value={branch.city} onChange={(e) => setBranch({ ...branch, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={branch.phone} onChange={(e) => setBranch({ ...branch, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Booking ID prefix</Label>
                  <Input value={branch.prefix} onChange={(e) => setBranch({ ...branch, prefix: e.target.value.toUpperCase().slice(0, 3) })} placeholder="TRT" maxLength={3} />
                  <p className="text-xs text-slate-400">Your booking IDs will look like: {branch.prefix || 'TRT'}-260326-001</p>
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
                          updated[i].name = e.target.value
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
                          updated[i].email = e.target.value
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
                          updated[i].role = v
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
                          updated[i].name = e.target.value
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
                          updated[i].category = v
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
                          updated[i].sizes = e.target.value
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
                          updated[i].dailyRate = Number(e.target.value)
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
                <CardTitle className="text-2xl">You&apos;re ready to go! 🎉</CardTitle>
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
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
            Back
          </Button>
          <div className="flex gap-2">
            {currentStep >= 2 && currentStep < 4 && (
              <Button variant="ghost" onClick={handleNext} className="text-slate-400">
                Skip for now
              </Button>
            )}
            {currentStep < 4 ? (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleNext}>
                Next →
              </Button>
            ) : (
              <Button className="bg-blue-600 hover:bg-blue-700 w-48" onClick={handleFinish} disabled={loading}>
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
