'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Building2, Store, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function SetupWizard() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState({
    businessName: '',
    branchName: 'Main Branch',
    subdomain: ''
  })

  const updateSubdomain = (name: string) => {
    const sub = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    setFormData(prev => ({ ...prev, businessName: name, subdomain: sub }))
  }

  const handleCompleteSetup = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // 1. Create Business
      const { data: business, error: bError } = await supabase
        .from('businesses')
        .insert({
          name: formData.businessName,
          subdomain: formData.subdomain,
          owner_id: user.id,
          status: 'active'
        })
        .select()
        .single()

      if (bError) throw bError

      // 2. Create Initial Branch
      const { data: branch, error: brError } = await supabase
        .from('branches')
        .insert({
          business_id: business.id,
          name: formData.branchName,
        })
        .select()
        .single()

      if (brError) throw brError

      // 3. Update Staff Record (User who created it becomes owner)
      const { error: sError } = await supabase
        .from('staff')
        .update({
          business_id: business.id,
          branch_id: branch.id,
          role: 'owner',
          status: 'approved'
        })
        .eq('id', user.id)

      if (sError) throw sError

      setStep(3) // Success
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err) {
      console.error('Setup error:', err)
      alert('Failed to complete setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#CCFF00] opacity-[0.05] blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 opacity-[0.05] blur-[100px] rounded-full animate-pulse delay-700" />

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#CCFF00] rounded-xl mb-4">
            <Zap className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Finalizing your Setup</h1>
          <p className="text-zinc-500">Just a few details to get your rental network online.</p>
        </div>

        <Card className="bg-zinc-900/50 backdrop-blur-2xl border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 ml-1">Business Name</Label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#CCFF00] transition-colors" />
                    <Input 
                      placeholder="e.g. Urban Ridings"
                      className="h-14 pl-12 bg-zinc-950 border-zinc-800 rounded-2xl text-white focus-visible:ring-[#CCFF00] focus-visible:ring-offset-0"
                      value={formData.businessName}
                      onChange={(e) => updateSubdomain(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest ml-1">Proposed Subdomain</p>
                  <p className="text-sm font-mono text-zinc-400 bg-zinc-950/50 p-3 rounded-xl border border-zinc-900 italic">
                    {formData.subdomain || 'your-business'}.echo.app
                  </p>
                </div>
              </div>

              <Button 
                size="lg"
                disabled={!formData.businessName}
                onClick={() => setStep(2)}
                className="w-full h-14 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold rounded-2xl transition-all"
              >
                Next Step <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 ml-1">First Branch Name</Label>
                  <div className="relative group">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#CCFF00] transition-colors" />
                    <Input 
                      placeholder="e.g. Bangalore Central"
                      className="h-14 pl-12 bg-zinc-950 border-zinc-800 rounded-2xl text-white focus-visible:ring-[#CCFF00] focus-visible:ring-offset-0"
                      value={formData.branchName}
                      onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed px-1">
                  You can add more branches later in the dashboard settings.
                </p>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="h-14 px-6 border-zinc-800 text-zinc-400 hover:text-white rounded-2xl"
                >
                  Back
                </Button>
                <Button 
                  size="lg"
                  disabled={!formData.branchName || loading}
                  onClick={handleCompleteSetup}
                  className="flex-1 h-14 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Everything Ready!</h2>
                <p className="text-zinc-400">Taking you to your brand new dashboard...</p>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {step < 3 && (
            <div className="mt-8 flex justify-center gap-2">
              <div className={`h-1 w-8 rounded-full transition-colors ${step === 1 ? 'bg-[#CCFF00]' : 'bg-zinc-800'}`} />
              <div className={`h-1 w-8 rounded-full transition-colors ${step === 2 ? 'bg-[#CCFF00]' : 'bg-zinc-800'}`} />
            </div>
          )}
        </Card>

        <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest mt-8 italic">
          Echo Enterprise OS • v1.0.4 • Scale without Limits
        </p>
      </div>
    </div>
  )
}
