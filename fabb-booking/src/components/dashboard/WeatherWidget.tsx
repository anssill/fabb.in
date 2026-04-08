'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { integrations, WeatherData } from '@/lib/integrations'
import { Cloud, Sun, CloudRain, Wind, Loader2 } from 'lucide-react'

export function WeatherWidget() {
  const { activeBranch } = useAppStore()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const integrationSettings = (activeBranch?.settings as any)?.integrations?.weather

  useEffect(() => {
    async function fetchWeather() {
      if (!activeBranch?.city || !integrationSettings?.enabled || !integrationSettings?.openweathermap_key) {
        return
      }
      setLoading(true)
      try {
        const data = await integrations.getWeather(activeBranch.city, integrationSettings.openweathermap_key)
        setWeather(data)
      } catch (error) {
        console.error('Weather fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [activeBranch?.city, integrationSettings?.enabled, integrationSettings?.openweathermap_key])

  if (!integrationSettings?.enabled) return null
  if (loading) return (
    <Card className="bg-slate-50 border-none shadow-none flex items-center justify-center p-4 h-[80px]">
      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
    </Card>
  )
  if (!weather) return null

  const Icon = weather.condition.toLowerCase().includes('cloud') ? Cloud 
             : weather.condition.toLowerCase().includes('rain') ? CloudRain
             : weather.condition.toLowerCase().includes('wind') ? Wind
             : Sun

  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none overflow-hidden h-full">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">{weather.city}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{weather.temp}°C</span>
            <span className="text-xs text-blue-100 capitalize">{weather.condition}</span>
          </div>
          <p className="text-[10px] text-blue-100/80 italic">{weather.description}</p>
        </div>
        <div className="bg-white/20 p-2 rounded-full">
          <Icon className="w-8 h-8 text-white" />
        </div>
      </CardContent>
    </Card>
  )
}
