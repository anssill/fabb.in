'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

interface Props {
  staff: Record<string, unknown>
  business: Record<string, unknown>
  branches: Record<string, unknown>[]
}

export function StoreInitializer({ staff, business, branches }: Props) {
  const { setStaff, setBusiness, setActiveBranch, setBranches } = useAppStore()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setStaff(staff as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setBusiness(business as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setBranches(branches as any)

    // Set active branch from staff's branch or first branch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeBranch = branches.find((b: any) => b.id === (staff as any).branch_id) || branches[0]
    if (activeBranch) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setActiveBranch(activeBranch as any)
    }
  }, [staff, business, branches, setStaff, setBusiness, setActiveBranch, setBranches])

  return null
}
