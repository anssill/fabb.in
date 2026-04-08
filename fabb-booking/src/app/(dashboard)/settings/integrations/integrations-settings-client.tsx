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
import { Save, Phone, Mail, Cloud, Globe, Key } from 'lucide-react'

export function IntegrationsSettingsClient() {
  const { activeBranch, setBranches, branches } = useAppStore()
  const supabase = createClient()
  const integrationSettings = ((activeBranch?.settings as any)?.integrations) || {}

  const [isSaving, setIsSaving] = useState(false)
  
  // Phone Validation State
  const [phoneEnabled, setPhoneEnabled] = useState(integrationSettings.phone?.enabled ?? false)
  const [numverifyKey, setNumverifyKey] = useState(integrationSettings.phone?.numverify_key ?? '')

  // Email Validation State
  const [emailEnabled, setEmailEnabled] = useState(integrationSettings.email?.enabled ?? false)
  const [cloudmersiveKey, setCloudmersiveKey] = useState(integrationSettings.email?.cloudmersive_key ?? '')

  // Weather State
  const [weatherEnabled, setWeatherEnabled] = useState(integrationSettings.weather?.enabled ?? false)
  const [openweathermapKey, setOpenweathermapKey] = useState(integrationSettings.weather?.openweathermap_key ?? '')

  // WhatsApp State
  const [whatsappEnabled, setWhatsappEnabled] = useState(integrationSettings.whatsapp?.enabled ?? false)
  const [interaktKey, setInteraktKey] = useState(integrationSettings.whatsapp?.interakt_key ?? '')

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

      {/* WhatsApp (Interakt) */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" /> WhatsApp (Interakt)
          </CardTitle>
          <CardDescription>Send automated booking confirmations and reminders via Interakt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Enable WhatsApp Notifications</Label>
            <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
          </div>
          {whatsappEnabled && (
            <div className="space-y-1.5 pt-2">
              <Label className="flex items-center gap-2 text-xs">
                <Key className="w-3 h-3" /> Interakt API Key
              </Label>
              <Input
                type="password"
                value={interaktKey}
                onChange={e => setInteraktKey(e.target.value)}
                placeholder="Enter your API key"
              />
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
