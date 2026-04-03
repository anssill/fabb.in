'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePinStore } from '@/lib/stores/usePinStore'
import { useUserStore } from '@/lib/stores/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { Lock, Delete } from 'lucide-react'

const PAD = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export function PinLock() {
  const { isLocked, unlock } = usePinStore()
  const profile = useUserStore((s) => s.profile)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const supabase = createClient()

  const handleKey = useCallback(
    (val: string) => {
      if (val === '⌫') {
        setInput((p) => p.slice(0, -1))
        setError('')
        return
      }
      if (input.length >= 6) return
      const next = input + val
      setInput(next)
      if (next.length === 4 || next.length === 6) {
        verifyPin(next)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input]
  )

  // Keyboard support
  useEffect(() => {
    if (!isLocked) return
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key)
      if (e.key === 'Backspace') handleKey('⌫')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isLocked, handleKey])

  async function verifyPin(pin: string) {
    if (!profile?.id) return
    setChecking(true)
    const { data } = await supabase
      .from('staff')
      .select('pin_code')
      .eq('id', profile.id)
      .single()
    setChecking(false)
    if (data?.pin_code && data.pin_code === pin) {
      unlock()
      setInput('')
      setError('')
    } else if (pin.length >= 4) {
      setError('Incorrect PIN. Try again.')
      setTimeout(() => { setInput(''); setError('') }, 1200)
    }
  }

  if (!isLocked) return null

  const initials = (profile?.name || 'ST')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center p-6 select-none">
      {/* Logo */}
      <div className="w-12 h-12 bg-[#ccff00] rounded-2xl flex items-center justify-center mb-8">
        <Lock className="w-6 h-6 text-black" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-1">Screen locked</h2>
      <p className="text-zinc-400 text-sm mb-8">Enter your PIN to unlock</p>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#ccff00] flex items-center justify-center font-bold text-black text-sm">
          {initials}
        </div>
        <span className="text-white font-medium">{profile?.name || 'Staff'}</span>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4 mb-3">
        {Array.from({ length: Math.max(input.length + 1, 4) > 6 ? 6 : 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-150 ${
              i < input.length
                ? 'bg-[#ccff00] scale-110'
                : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      <div className="h-5 mb-4">
        {error && <p className="text-red-400 text-sm animate-shake">{error}</p>}
        {checking && <p className="text-zinc-500 text-sm">Checking…</p>}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {PAD.map((key, i) => {
          if (key === '') return <div key={i} />
          return (
            <button
              key={i}
              onClick={() => handleKey(key)}
              className={`h-16 rounded-2xl text-xl font-semibold transition-all duration-100 active:scale-95 ${
                key === '⌫'
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-600'
              }`}
            >
              {key === '⌫' ? <Delete className="w-5 h-5 mx-auto" /> : key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
