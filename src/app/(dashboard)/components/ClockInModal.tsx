'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calculateDistance } from '@/lib/utils'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ClockInModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  
  const { activeBranch, staff } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      getLocation()
    } else {
      setLocation(null)
      setDistance(null)
      setError(null)
    }
  }, [isOpen])

  const getLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        
        if (activeBranch?.lat && activeBranch?.lng) {
          const dist = calculateDistance(
            latitude,
            longitude,
            Number(activeBranch.lat),
            Number(activeBranch.lng)
          )
          setDistance(dist)
        }
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Failed to get location.')
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleClockIn = async () => {
    if (!location || !staff || !activeBranch) return
    setLoading(true)

    const isValidLocation = distance !== null && distance <= (activeBranch.gps_radius_metres || 100)

    try {
      const { error: insertError } = await supabase
        .from('staff_attendance')
        .insert({
          business_id: staff.business_id,
          branch_id: activeBranch.id,
          staff_id: staff.id,
          date: new Date().toISOString().split('T')[0],
          clock_in_at: new Date().toISOString(),
          clock_in_lat: location.lat,
          clock_in_lng: location.lng,
          distance_from_branch: distance,
          is_valid_location: isValidLocation
        })

      if (insertError) throw insertError

      toast.success(isValidLocation ? 'Clock-in successful!' : 'Clocked in outside branch radius (logged for review).')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to clock in.')
    } finally {
      setLoading(false)
    }
  }

  const isWithinRadius = distance !== null && distance <= (activeBranch?.gps_radius_metres || 100)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Staff Clock-In
          </DialogTitle>
          <DialogDescription>
            Verify your location to start your shift at {activeBranch?.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-500">Getting precise location...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <p className="text-sm font-medium text-rose-600">{error}</p>
              <Button variant="outline" size="sm" onClick={getLocation} className="mt-2">
                Retry Location
              </Button>
            </div>
          ) : location ? (
            <div className="w-full space-y-4">
              <div className={`p-4 rounded-xl border-l-4 flex items-start gap-4 transition-all ${
                isWithinRadius 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
                : 'bg-amber-50 border-amber-500 text-amber-900'
              }`}>
                {isWithinRadius ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-bold">
                    {isWithinRadius ? 'Location Verified' : 'Outside Branch Radius'}
                  </p>
                  <p className="text-xs opacity-80 mt-1">
                    {distance !== null 
                      ? `Distance: ${distance.toFixed(0)}m from ${activeBranch?.name}` 
                      : 'Calculating distance...'}
                  </p>
                </div>
              </div>

              {!isWithinRadius && (
                <p className="text-xs text-slate-500 italic px-1">
                  Note: Operating outside the radius will flag this entry for manager review.
                </p>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 h-10 px-8" 
            disabled={loading || !location}
            onClick={handleClockIn}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Navigation className="w-4 h-4 mr-2" />}
            Confirm Clock-In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
