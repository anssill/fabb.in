'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import type * as React from 'react'
import { getQueryClient } from '@/lib/queries/queryClient'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  )
}
