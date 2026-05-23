'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

type Theme = 'light' | 'dark' | 'system'
type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD-MMM-YYYY'
type CurrencyFormat = 'indian' | 'international'

interface DisplayPreferences {
  theme: Theme
  dateFormat: DateFormat
  currencyFormat: CurrencyFormat
}

const defaultPreferences: DisplayPreferences = {
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  currencyFormat: 'indian',
}

export function DisplayPreferencesClient({ initialPreferences }: { initialPreferences?: Partial<DisplayPreferences> | null }) {
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme()
  const [theme, setTheme] = useState<Theme>((initialPreferences?.theme as Theme) || defaultPreferences.theme)
  const [dateFormat, setDateFormat] = useState<DateFormat>((initialPreferences?.dateFormat as DateFormat) || defaultPreferences.dateFormat)
  const [currencyFormat, setCurrencyFormat] = useState<CurrencyFormat>((initialPreferences?.currencyFormat as CurrencyFormat) || defaultPreferences.currencyFormat)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fabb_display_prefs')
      if (initialPreferences?.theme || initialPreferences?.dateFormat || initialPreferences?.currencyFormat) {
        const next = {
          ...defaultPreferences,
          ...initialPreferences,
        } as DisplayPreferences
        setTheme(next.theme)
        setDateFormat(next.dateFormat)
        setCurrencyFormat(next.currencyFormat)
        setNextTheme(next.theme)
        localStorage.setItem('fabb_display_prefs', JSON.stringify(next))
      } else if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.theme) {
          setTheme(parsed.theme as Theme)
          // Ensure next-themes is in sync with our saved preference
          if (nextTheme !== parsed.theme) {
            setNextTheme(parsed.theme as Theme)
          }
        }
        if (parsed.dateFormat) setDateFormat(parsed.dateFormat as DateFormat)
        if (parsed.currencyFormat) setCurrencyFormat(parsed.currencyFormat as CurrencyFormat)
      } else if (nextTheme) {
        setTheme(nextTheme as Theme)
      }
    } catch {}
  }, [initialPreferences, nextTheme, setNextTheme])

  async function savePrefs(updates: Partial<DisplayPreferences>) {
    const current = {
      theme, dateFormat, currencyFormat,
      ...updates,
    }
    localStorage.setItem('fabb_display_prefs', JSON.stringify(current))

    // Apply theme immediately via next-themes
    if (updates.theme) {
      setNextTheme(updates.theme)
    }

    try {
      const res = await fetch('/api/account/display-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current),
      })
      if (!res.ok) throw new Error('Failed to save display preferences')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save display preferences')
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
            onValueChange={(v) => { setTheme(v as Theme); void savePrefs({ theme: v as Theme }) }}
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
            onValueChange={(v) => { setDateFormat(v as DateFormat); void savePrefs({ dateFormat: v as DateFormat }) }}
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
            onValueChange={(v) => { setCurrencyFormat(v as CurrencyFormat); void savePrefs({ currencyFormat: v as CurrencyFormat }) }}
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

      <p className="text-xs text-slate-400 text-center">Preferences are saved to your account and synced on this device.</p>
    </div>
  )
}
