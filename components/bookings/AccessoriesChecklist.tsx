import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface AccessoriesChecklistProps {
  items: Record<string, boolean>
  onChange: (type: string, checked: boolean) => void
  readOnly?: boolean
}

export function AccessoriesChecklist({ items, onChange, readOnly = false }: AccessoriesChecklistProps) {
  const accessoryTypes = ['Dupatta', 'Mojri', 'Jewellery', 'Belt']

  return (
    <div className="space-y-4 rounded-md border p-4 bg-muted/20">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Accessories Checklist</h3>
      <div className="grid grid-cols-2 gap-4">
        {accessoryTypes.map(type => (
          <div key={type} className="flex items-center space-x-2">
            <Checkbox 
              id={`acc-${type}`} 
              checked={items[type.toLowerCase()] || false}
              disabled={readOnly}
              onCheckedChange={(checked) => onChange(type.toLowerCase(), checked === true)}
            />
            <Label htmlFor={`acc-${type}`} className="cursor-pointer">{type}</Label>
          </div>
        ))}
      </div>
    </div>
  )
}
