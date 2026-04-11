'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Lock, Delete } from 'lucide-react'

const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

interface Props {
  staffId: string
  pinHash: string | null
}

// Simple client-side PIN check (4-digit PIN stored as SHA-256 hash in DB)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function PinLock({ staffId, pinHash }: Props) {
  const [locked, setLocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (pinHash) {
      idleTimerRef.current = setTimeout(() => setLocked(true), IDLE_TIMEOUT_MS)
    }
  }, [pinHash])

  useEffect(() => {
    if (!pinHash) return
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll']
    events.forEach((e) => window.addEventListener(e, resetIdleTimer))
    resetIdleTimer()
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer))
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [pinHash, resetIdleTimer])

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return
    const newPin = pin + d
    setPin(newPin)
    setError('')
    if (newPin.length === 4) {
      verifyPin(newPin)
    }
  }

  const verifyPin = async (entered: string) => {
    const hash = await hashPin(entered)
    if (hash === pinHash) {
      setLocked(false)
      setPin('')
      resetIdleTimer()
    } else {
      setError('Incorrect PIN')
      setShaking(true)
      setPin('')
      setTimeout(() => setShaking(false), 600)
    }
  }

  if (!locked || !pinHash) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center">
      <div className={`space-y-6 text-center ${shaking ? 'animate-bounce' : ''}`}>
        <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Screen Locked</h2>
          <p className="text-sm text-slate-400 mt-1">Enter your 4-digit PIN to continue</p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4 justify-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < pin.length ? 'bg-blue-400 border-blue-400' : 'border-slate-500'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {['1','2','3','4','5','6','7','8','9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="w-16 h-16 rounded-full bg-slate-800 text-white text-xl font-semibold hover:bg-slate-700 active:bg-slate-600 transition-colors"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="w-16 h-16 rounded-full bg-slate-800 text-white text-xl font-semibold hover:bg-slate-700 active:bg-slate-600 transition-colors"
          >
            0
          </button>
          <button
            onClick={() => setPin((p) => p.slice(0, -1))}
            className="w-16 h-16 rounded-full text-slate-400 hover:text-white flex items-center justify-center mx-auto"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
