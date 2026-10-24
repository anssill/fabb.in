'use client'

import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export const SIZE_PRESETS: Record<string, string[]> = {
  Clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'],
  'Numeric / waist': Array.from({ length: 19 }, (_, i) => String(28 + i)),
  'Shoes (UK / India)': Array.from({ length: 11 }, (_, i) => String(3 + i)),
  'Shoes (EU)': Array.from({ length: 15 }, (_, i) => String(32 + i)),
  'Kids (months)': ['0-3 months', '3-6 months', '6-9 months', '9-12 months', '12-18 months', '18-24 months'],
  'Kids (years)': Array.from({ length: 14 }, (_, i) => `${i + 1}-${i + 2} years`),
}

export function categorySizePresets(category?: string): Record<string, string[]> {
  if (!category) return SIZE_PRESETS
  if (/loafer|shoe|footwear|sandal|boot/i.test(category)) return Object.fromEntries(Object.entries(SIZE_PRESETS).filter(([group]) => group.startsWith('Shoes')))
  if (/saree|sari|jewell|accessor|cap|turban/i.test(category)) return { 'One size': ['Free Size'] }
  if (/kid|child|baby/i.test(category)) return Object.fromEntries(Object.entries(SIZE_PRESETS).filter(([group]) => group.startsWith('Kids')))
  return { Clothing: SIZE_PRESETS.Clothing, 'Numeric / waist': SIZE_PRESETS['Numeric / waist'] }
}

export function SizePicker({ value, onChange, category }: { value: string; onChange: (value: string) => void; category?: string }) {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs">Size / custom size *</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Type any size, e.g. 32, UK 8.5, 4-5 years" />
      <p className="text-xs text-muted-foreground">Enter your own size or choose a preset below. Include UK / EU in custom shoe sizes if needed.</p>
      <details className="rounded-lg border border-input p-2">
        <summary className="cursor-pointer text-xs font-medium">Choose {category || 'preset'} sizes</summary>
        <div className="mt-2 space-y-3">
          {Object.entries(categorySizePresets(category)).map(([group, sizes]) => (
            <div key={group} className="space-y-1">
              <p className="text-xs text-muted-foreground">{group}</p>
              <div className="flex flex-wrap gap-1">
                {sizes.map((size) => (
                  <button key={size} type="button" aria-pressed={value === size} onClick={() => onChange(size)} className={`rounded border px-2 py-1 text-xs ${value === size ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:border-primary'}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

export function CustomBulkSizes({ selected, onChange }: { selected: string[]; onChange: (sizes: string[]) => void }) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const addSizes = () => {
    const sizes = new Map(selected.map((size) => [size.trim().toLowerCase(), size]))
    for (const size of draft.split(',').map((size) => size.trim()).filter(Boolean)) {
      if (!sizes.has(size.toLowerCase())) sizes.set(size.toLowerCase(), size)
    }
    onChange([...sizes.values()])
    setDraft('')
  }
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Custom sizes</Label>
      <div className="flex flex-wrap gap-2">
        <Input id={id} className="min-w-0 flex-1" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSizes() } }} placeholder="e.g. UK 8.5, 16 years, Made to measure" />
        <Button type="button" variant="outline" onClick={addSizes} disabled={!draft.split(',').some((size) => size.trim())}>Select custom sizes</Button>
      </div>
      <p className="text-xs text-muted-foreground">Separate sizes with commas, select them, then use Add sizes below.</p>
      {selected.length > 0 && <div className="flex flex-wrap gap-1" aria-label="Selected sizes">
        {selected.map((size) => <Button key={size} type="button" size="sm" variant="secondary" aria-label={`Remove selected size ${size}`} onClick={() => onChange(selected.filter((entry) => entry !== size))}>{size} ×</Button>)}
      </div>}
    </div>
  )
}
