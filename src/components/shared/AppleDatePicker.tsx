'use client'

import { useId, useSyncExternalStore, type ReactNode } from 'react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { isAppleDevice, localDate } from '@/lib/native-date'

const subscribe = () => () => {}
const serverSnapshot = () => false
const clientSnapshot = () => isAppleDevice(navigator.platform, navigator.userAgent)

type Props = {
  id: string
  label: string
  value: string
  min?: string
  max?: string
  required?: boolean
  onChange: (value: string) => void
  children?: ReactNode
}

export function AppleDatePicker({ children, label, onChange, ...props }: Props) {
  const native = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
  if (!native) return children
  return <Input {...props} type="date" aria-label={label} className="h-10 min-w-0 w-full text-base"
    onChange={event => {
      const input = event.currentTarget
      if (!input.value || input.validity.valid) onChange(input.value)
    }} />
}

export function AppleDateRange({ range, onChange, children }: {
  range: { from: Date; to: Date }
  onChange: (range: { from: Date; to: Date }) => void
  children: ReactNode
}) {
  const native = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
  const id = useId()
  if (!native) return children
  return <div className="flex min-w-0 flex-wrap gap-2">
    <label htmlFor={`${id}-from`} className="min-w-0 flex-1 text-xs text-muted-foreground">Pickup date
      <AppleDatePicker id={`${id}-from`} label="Pickup date" required value={format(range.from, 'yyyy-MM-dd')}
        onChange={value => { if (value) { const from = localDate(value); onChange({ from, to: range.to < from ? from : range.to }) } }} />
    </label>
    <label htmlFor={`${id}-to`} className="min-w-0 flex-1 text-xs text-muted-foreground">Return date
      <AppleDatePicker id={`${id}-to`} label="Return date" required value={format(range.to, 'yyyy-MM-dd')} min={format(range.from, 'yyyy-MM-dd')}
        onChange={value => { if (value) onChange({ ...range, to: localDate(value) }) }} />
    </label>
  </div>
}
