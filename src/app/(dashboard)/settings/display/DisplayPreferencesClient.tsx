'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Monitor, Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'
type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD-MMM-YYYY'
type CurrencyFormat = 'indian' | 'international'

export function DisplayPreferencesClient() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    try {
      const saved = localStorage.getItem('fabb_display_prefs')
      if (saved) return (JSON.parse(saved).theme ?? 'light') as Theme
    } catch {}
    return 'light'
  })
  const [dateFormat, setDateFormat] = useState<DateFormat>(() => {
    if (typeof window === 'undefined') return 'DD/MM/YYYY'
    try {
      const saved = localStorage.getItem('fabb_display_prefs')
      if (saved) return (JSON.parse(saved).dateFormat ?? 'DD/MM/YYYY') as DateFormat
    } catch {}
    return 'DD/MM/YYYY'
  })
  const [currencyFormat, setCurrencyFormat] = useState<CurrencyFormat>(() => {
    if (typeof window === 'undefined') return 'indian'
    try {
      const saved = localStorage.getItem('fabb_display_prefs')
      if (saved) return (JSON.parse(saved).currencyFormat ?? 'indian') as CurrencyFormat
    } catch {}
    return 'indian'
  })

  function savePrefs(updates: Partial<{ theme: Theme; dateFormat: DateFormat; currencyFormat: CurrencyFormat }>) {
    const current = {
      theme, dateFormat, currencyFormat,
      ...updates,
    }
    localStorage.setItem('fabb_display_prefs', JSON.stringify(current))

    // Apply theme immediately
    const t = current.theme
    const root = document.documentElement
    if (t === 'dark') root.classList.add('dark')
    else if (t === 'light') root.classList.remove('dark')
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark')
      else root.classList.remove('dark')
    }
  }

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={(v) => { setTheme(v as Theme); savePrefs({ theme: v as Theme }) }}
            className="grid grid-cols-3 gap-3"
          >
            {([
              { value: 'light', label: 'Light', Icon: Sun },
              { value: 'dark', label: 'Dark', Icon: Moon },
              { value: 'system', label: 'System', Icon: Monitor },
            ] as const).map(({ value, label, Icon }) => (
              <Label
                key={value}
                htmlFor={`theme-${value}`}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  theme === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <RadioGroupItem value={value} id={`theme-${value}`} className="sr-only" />
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Date Format */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Date Format</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={dateFormat}
            onValueChange={(v) => { setDateFormat(v as DateFormat); savePrefs({ dateFormat: v as DateFormat }) }}
            className="space-y-3"
          >
            {([
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '26/03/2026' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '03/26/2026' },
              { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY', example: '26 Mar 2026' },
            ] as const).map(({ value, label, example }) => (
              <div key={value} className="flex items-center gap-3">
                <RadioGroupItem value={value} id={`date-${value}`} />
                <Label htmlFor={`date-${value}`} className="flex items-center gap-3 cursor-pointer flex-1">
                  <span className="text-sm">{label}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">{example}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Currency Format */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Currency Format</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currencyFormat}
            onValueChange={(v) => { setCurrencyFormat(v as CurrencyFormat); savePrefs({ currencyFormat: v as CurrencyFormat }) }}
            className="space-y-3"
          >
            {([
              { value: 'indian', label: 'Indian (Lakh format)', example: '₹1,00,000' },
              { value: 'international', label: 'International', example: '₹100,000' },
            ] as const).map(({ value, label, example }) => (
              <div key={value} className="flex items-center gap-3">
                <RadioGroupItem value={value} id={`currency-${value}`} />
                <Label htmlFor={`currency-${value}`} className="flex items-center gap-3 cursor-pointer flex-1">
                  <span className="text-sm">{label}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">{example}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400 text-center">Preferences are saved automatically to this device.</p>
    </div>
  )
}
