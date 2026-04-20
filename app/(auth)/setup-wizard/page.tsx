'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, 
  MapPin, 
  Phone, 
  Settings2, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  Sparkles,
  Target,
  Layout
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Step = 'branch' | 'preferences' | 'success'

export default function SetupWizard() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>('branch')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State for Wizard
  const [branchName, setBranchName] = useState('')
  const [branchAddress, setBranchAddress] = useState('')
  const [branchPhone, setBranchPhone] = useState('')
  const [revenueTarget, setRevenueTarget] = useState('100000')
  const [advancePct, setAdvancePct] = useState('30')

  const [staff, setStaff] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: staffData } = await supabase
        .from('staff')
        .select('*, businesses(*)')
        .eq('id', user.id)
        .single()

      if (staffData) {
        setStaff(staffData)
        setBusiness(staffData.businesses)
        setBranchName(`${staffData.businesses.name} — Main`)
      }
    }
    loadData()
  }, [])

  const handleCompleteSetup = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !business) return

      // 1. Create the branch
      const { data: branch, error: branchErr } = await supabase
        .from('branches')
        .insert({
          business_id: business.id,
          name: branchName,
          address: branchAddress,
          phone: branchPhone,
          settings: {
            monthly_revenue_target: parseInt(revenueTarget),
            min_advance_pct: parseInt(advancePct),
            max_advance_days: 180,
            buffer_days: 1,
            low_stock_threshold: 1,
            tier_thresholds: { silver: 5000, gold: 15000, platinum: 30000 },
          }
        })
        .select()
        .single()

      if (branchErr) throw branchErr

      // 2. Update staff with branch_id and setup_completed = true
      const { error: staffUpdateErr } = await supabase
        .from('staff')
        .update({
          business_id: business.id,
          branch_id: branch.id,
          role: 'owner',
          setup_completed: true,
          status: 'approved'
        })
        .eq('id', user.id)

      if (staffUpdateErr) throw staffUpdateErr

      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup.')
    } finally {
      setLoading(false)
    }
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#CCFF00] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-[#CCFF00] selection:text-black">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#CCFF00]/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#CCFF00]/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 lg:py-24">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[#CCFF00] text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Echo Onboarding</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Finish setting up <span className="text-[#CCFF00]">{business.name}</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Let's get your first branch ready so you can start managing bookings.
          </p>
        </div>

        {/* Wizard Progress */}
        <div className="flex gap-2 mb-8">
          {(['branch', 'preferences', 'success'] as Step[]).map((s, i) => (
            <div 
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= ['branch', 'preferences', 'success'].indexOf(step) 
                ? 'bg-[#CCFF00]' 
                : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
          {step === 'branch' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#CCFF00]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Store Details</h2>
                  <p className="text-sm text-zinc-500">Add your first branch or warehouse</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                    <Input
                      id="branchName"
                      placeholder="e.g. Bandra Flagship Store"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 h-12 pl-12 focus:ring-[#CCFF00] focus:border-[#CCFF00]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchAddress">Full Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                    <Input
                      id="branchAddress"
                      placeholder="Street, City, Pin Code"
                      value={branchAddress}
                      onChange={(e) => setBranchAddress(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 h-12 pl-12 focus:ring-[#CCFF00] focus:border-[#CCFF00]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchPhone">Contact Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                    <Input
                      id="branchPhone"
                      placeholder="+91"
                      value={branchPhone}
                      onChange={(e) => setBranchPhone(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 h-12 pl-12 focus:ring-[#CCFF00] focus:border-[#CCFF00]"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep('preferences')}
                disabled={!branchName || !branchAddress || !branchPhone}
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold h-12 rounded-xl transition-all active:scale-[0.98]"
              >
                Continue to Preferences <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 'preferences' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center">
                  <Settings2 className="w-6 h-6 text-[#CCFF00]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Store Settings</h2>
                  <p className="text-sm text-zinc-500">Configure your business goals</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-[#CCFF00]">
                    <Target className="w-5 h-5" />
                    <span className="font-semibold text-sm uppercase tracking-wider">Revenue Target</span>
                  </div>
                  <Label className="text-zinc-500 text-xs">Monthly goal (₹)</Label>
                  <Input 
                    type="number"
                    value={revenueTarget}
                    onChange={(e) => setRevenueTarget(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 h-10 text-white font-bold"
                  />
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-[#CCFF00]">
                    <Layout className="w-5 h-5" />
                    <span className="font-semibold text-sm uppercase tracking-wider">Advance Pct</span>
                  </div>
                  <Label className="text-zinc-500 text-xs">Min booking deposit (%)</Label>
                  <Input 
                    type="number"
                    value={advancePct}
                    onChange={(e) => setAdvancePct(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 h-10 text-white font-bold"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('branch')}
                  className="flex-1 border-zinc-800 hover:bg-zinc-800 text-white h-12 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCompleteSetup}
                  disabled={loading}
                  className="flex-[2] bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold h-12 rounded-xl transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Complete Setup <Sparkles className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-6 animate-in zoom-in-95 duration-700">
              <div className="mx-auto w-24 h-24 bg-[#CCFF00] rounded-[2rem] flex items-center justify-center rotate-3 shadow-[0_0_40px_rgba(204,255,0,0.3)]">
                <CheckCircle2 className="w-16 h-16 text-black" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">You're all set!</h2>
                <p className="text-zinc-400 text-lg">
                  Welcome aboard. Your dashboard is ready.
                </p>
              </div>

              <Button
                onClick={() => router.push('/')}
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold h-14 text-xl rounded-2xl transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(204,255,0,0.2)]"
              >
                Go to Dashboard <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-zinc-600 text-sm">
          <p>© 2026 Echo Booking Systems. Professional Tenant Onboarding.</p>
        </div>
      </div>
    </div>
  )
}
