'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Save, Phone, Mail, Cloud, Globe, Key, Send, CheckCircle2, AlertCircle } from 'lucide-react'

export function IntegrationsSettingsClient() {
  const { activeBranch, setBranches, branches } = useAppStore()
  const supabase = createClient()
  const integrationSettings = ((activeBranch?.settings as any)?.integrations) || {}

  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  
  // WhatsApp State (Official Meta API)
  const [whatsappEnabled, setWhatsappEnabled] = useState(integrationSettings.whatsapp?.enabled ?? true)
  const [whatsappPhoneId, setWhatsappPhoneId] = useState(integrationSettings.whatsapp?.phone_id ?? '1150487028140544')
  const [interaktKey, setInteraktKey] = useState(integrationSettings.whatsapp?.interakt_key ?? '')
  const [testNumber, setTestNumber] = useState('')

  // Phone State
  const [phoneEnabled, setPhoneEnabled] = useState(integrationSettings.phone?.enabled ?? true)
  const [numverifyKey, setNumverifyKey] = useState(integrationSettings.phone?.numverify_key ?? '')

  // Email State
  const [emailEnabled, setEmailEnabled] = useState(integrationSettings.email?.enabled ?? true)
  const [cloudmersiveKey, setCloudmersiveKey] = useState(integrationSettings.email?.cloudmersive_key ?? '')

  // Weather State
  const [weatherEnabled, setWeatherEnabled] = useState(integrationSettings.weather?.enabled ?? true)
  const [openweathermapKey, setOpenweathermapKey] = useState(integrationSettings.weather?.openweathermap_key ?? '')

  // Currency State
  const [currencyEnabled, setCurrencyEnabled] = useState(integrationSettings.currency?.enabled ?? true)

  async function handleSave() {
    if (!activeBranch) return
    setIsSaving(true)
    try {
      const branchSettings = (activeBranch.settings as any) || {}
      const newSettings = {
        ...branchSettings,
        integrations: {
          phone: { enabled: phoneEnabled, numverify_key: numverifyKey },
          email: { enabled: emailEnabled, cloudmersive_key: cloudmersiveKey },
          weather: { enabled: weatherEnabled, openweathermap_key: openweathermapKey },
          whatsapp: { enabled: whatsappEnabled, interakt_key: interaktKey },
          currency: { enabled: currencyEnabled }
        }
      }
      const { error } = await supabase
        .from('branches')
        .update({ settings: newSettings })
        .eq('id', activeBranch.id)
      
      if (error) throw error
      
      setBranches(branches.map(b => b.id === activeBranch.id ? { ...b, settings: newSettings } : b))
      toast.success('Integration settings saved successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save integration settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Phone Validation */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-500" /> Phone Validation
          </CardTitle>
          <CardDescription>Verify Indian mobile numbers using Numverify API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Enable Validation</Label>
            <Switch checked={phoneEnabled} onCheckedChange={setPhoneEnabled} />
          </div>
          {phoneEnabled && (
            <div className="space-y-1.5 pt-2">
              <Label className="flex items-center gap-2 text-xs">
                <Key className="w-3 h-3" /> Numverify API Key
              </Label>
              <Input
                type="password"
                value={numverifyKey}
                onChange={e => setNumverifyKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Validation */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-500" /> Email Verification
          </CardTitle>
          <CardDescription>Detect disposable emails and verify addresses via Cloudmersive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Enable Verification</Label>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
          {emailEnabled && (
            <div className="space-y-1.5 pt-2">
              <Label className="flex items-center gap-2 text-xs">
                <Key className="w-3 h-3" /> Cloudmersive API Key
              </Label>
              <Input
                type="password"
                value={cloudmersiveKey}
                onChange={e => setCloudmersiveKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather Forecast */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Cloud className="w-4 h-4 text-slate-500" /> Weather Forecast
          </CardTitle>
          <CardDescription>Show event-day weather on calendars and dashboards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Enable Weather Widget</Label>
            <Switch checked={weatherEnabled} onCheckedChange={setWeatherEnabled} />
          </div>
          {weatherEnabled && (
            <div className="space-y-1.5 pt-2">
              <Label className="flex items-center gap-2 text-xs">
                <Key className="w-3 h-3" /> OpenWeatherMap API Key
              </Label>
              <Input
                type="password"
                value={openweathermapKey}
                onChange={e => setOpenweathermapKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp (Official Meta API) */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#25D366]" /> Meta WhatsApp Cloud API
          </CardTitle>
          <CardDescription>Automated booking confirmations and reminders via official Meta API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Enable WhatsApp</Label>
            <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
          </div>
          
          {whatsappEnabled && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  WhatsApp Phone ID
                </Label>
                <Input
                  value={whatsappPhoneId}
                  onChange={e => setWhatsappPhoneId(e.target.value)}
                  placeholder="e.g. 1150487028140544"
                  className="font-mono text-sm"
                />
              </div>

              <Separator className="bg-slate-100" />
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Test Integration</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter 10-digit phone for test..." 
                    value={testNumber}
                    onChange={e => setTestNumber(e.target.value)}
                    className="flex-1 bg-white"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5"
                    disabled={isTesting || !testNumber}
                    onClick={async () => {
                      if (testNumber.length < 10) return toast.error('Enter a valid phone number')
                      setIsTesting(true)
                      try {
                        // We trigger a server action or internal API for the test
                        toast.promise(fetch('/api/integrations/whatsapp/test', {
                          method: 'POST',
                          body: JSON.stringify({ phone: testNumber })
                        }), {
                          loading: 'Sending test WhatsApp...',
                          success: 'Check your phone! Message sent.',
                          error: 'Failed to send. Check your API credentials.'
                        })
                      } finally {
                        setIsTesting(false)
                      }
                    }}
                  >
                    {isTesting ? 'Sending...' : <Send className="w-3.5 h-3.5 mr-2" />}
                    Test
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currency Exchange */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" /> Currency Exchange
          </CardTitle>
          <CardDescription>Automatically fetch latest INR exchange rates (Exchangerate.host).</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label className="text-sm font-medium">Enabled (Default)</Label>
          <Switch checked={currencyEnabled} onCheckedChange={setCurrencyEnabled} />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save Integrations</>}
        </Button>
      </div>
    </div>
  )
}
