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
          contact_phone: branchPhone, // Matches schema field name contact_phone
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (branchErr) throw branchErr

      // 2. Update staff with branch_id and setup_completed = true
      const { error: staffUpdateErr } = await supabase
        .from('staff')
        .update({
          branch_id: branch.id,
          role: 'owner',
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
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#CCFF00] animate-spin" />
        <p className="mt-4 text-zinc-500 font-medium">Preparing your workspace...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-[#CCFF00] selection:text-black flex flex-col items-center justify-center p-4">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#CCFF00]/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#CCFF00]/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-[#CCFF00] rounded-2xl flex items-center justify-center mb-5">
            <Sparkles className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Finish setting up <span className="text-[#CCFF00]">{business.name}</span>
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Let's get your first branch ready in just two steps
          </p>
        </div>

        {/* Wizard Progress */}
        <div className="flex gap-2 mb-6 px-1">
          {(['branch', 'preferences', 'success'] as Step[]).map((s, i) => (
            <div 
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-700 ${
                i <= ['branch', 'preferences', 'success'].indexOf(step) 
                ? 'bg-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.5)]' 
                : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Steps Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden min-h-[460px] flex flex-col">
          {step === 'branch' && (
            <div className="space-y-6 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="space-y-1">
                  <h2 className="text-lg font-bold">Store Details</h2>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Step 1 of 2</p>
               </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                  <Label htmlFor="branchName" className="text-zinc-300 text-sm font-medium">Branch Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                    <Input
                      id="branchName"
                      placeholder="e.g. Bandra Flagship Store"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl pl-11 focus:ring-[#CCFF00] focus:border-[#CCFF00]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchAddress" className="text-zinc-300 text-sm font-medium">Full Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                    <Input
                      id="branchAddress"
                      placeholder="Street, City, Pin Code"
                      value={branchAddress}
                      onChange={(e) => setBranchAddress(e.target.value)}
                      className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl pl-11 focus:ring-[#CCFF00] focus:border-[#CCFF00]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchPhone" className="text-zinc-300 text-sm font-medium">Contact Number *</Label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3 h-11 text-sm text-zinc-400 bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-xl font-medium">
                      +91
                    </span>
                    <Input
                      id="branchPhone"
                      placeholder="9876543210"
                      value={branchPhone}
                      onChange={(e) => setBranchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-l-none rounded-r-xl w-full"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep('preferences')}
                disabled={!branchName || !branchAddress || !branchPhone}
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold h-12 rounded-xl transition-all active:scale-[0.98] mt-4"
              >
                Continue to Preferences <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 'preferences' && (
            <div className="space-y-6 flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-1">
                  <h2 className="text-lg font-bold">Business Settings</h2>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Step 2 of 2</p>
               </div>

              <div className="space-y-4 flex-1">
                <div className="p-5 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/10 flex items-center justify-center border border-[#CCFF00]/20">
                      <Target className="w-5 h-5 text-[#CCFF00]" />
                    </div>
                    <div>
                      <Label className="text-zinc-300 font-semibold">Monthly Revenue Target</Label>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Budget Goal (₹)</p>
                    </div>
                  </div>
                  <Input 
                    type="number"
                    value={revenueTarget}
                    onChange={(e) => setRevenueTarget(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 h-11 text-white font-bold rounded-xl"
                  />
                </div>

                <div className="p-5 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/10 flex items-center justify-center border border-[#CCFF00]/20">
                      <Layout className="w-5 h-5 text-[#CCFF00]" />
                    </div>
                    <div>
                      <Label className="text-zinc-300 font-semibold">Min Advance Deposit</Label>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Booking Security (%)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Input 
                        type="number"
                        value={advancePct}
                        onChange={(e) => setAdvancePct(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 h-11 text-white font-bold rounded-xl"
                     />
                     <span className="text-lg font-bold text-zinc-600">%</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('branch')}
                  className="flex-1 border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-400 h-12 rounded-xl"
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
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-700">
              <div className="w-20 h-20 bg-[#CCFF00] rounded-3xl flex items-center justify-center rotate-3 shadow-[0_0_50px_rgba(204,255,0,0.3)]">
                <CheckCircle2 className="w-12 h-12 text-black" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">Workspace Ready! 🚀</h2>
                <p className="text-zinc-400 font-medium max-w-[240px] mx-auto">
                   Welcome to the futuristic era of booking management.
                </p>
              </div>

              <Button
                onClick={() => router.push('/')}
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold h-14 text-lg rounded-2xl transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(204,255,0,0.2)] mt-4"
              >
                Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
           <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Powered by Echo Unified Systems</p>
        </div>
      </div>
    </div>
  )
}
