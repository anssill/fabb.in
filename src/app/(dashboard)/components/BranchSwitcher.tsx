'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { switchActiveBranch } from './branch-actions'

interface Branch {
  id: string
  name: string
}

interface Props {
  branches: Branch[]
  currentBranchId: string
  collapsed?: boolean
}

export function BranchSwitcher({ branches, currentBranchId, collapsed }: Props) {
  const router = useRouter()
  const { setActiveBranch, branches: storeBranches } = useAppStore()

  if (branches.length <= 1 && !collapsed) {
    const branch = branches[0] || { name: 'Main Branch' }
    return (
      <div className="flex items-center gap-2 px-1 py-1.5 text-sm text-slate-500">
        <Building2 className="w-4 h-4 shrink-0" />
        <span className="truncate">{branch.name}</span>
      </div>
    )
  }

  if (collapsed) {
    return (
      <div className="flex justify-center p-2 text-slate-400">
        <Building2 className="w-5 h-5" />
      </div>
    )
  }

  const handleSwitch = async (branchId: string) => {
    try {
      const branch = storeBranches.find(b => b.id === branchId)
      if (branch) setActiveBranch(branch)
      
      // Update the database so server components see the new branch
      await switchActiveBranch(branchId)
      
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch branch')
    }
  }

  return (
    <Select value={currentBranchId} onValueChange={handleSwitch}>
      <SelectTrigger className="w-full h-9 bg-transparent border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
        <div className="flex items-center gap-2 overflow-hidden">
          <Building2 className="w-4 h-4 shrink-0 text-slate-400" />
          <SelectValue placeholder="Select branch" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
