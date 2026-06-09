'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'

export function ResponsiveDialog(props: React.ComponentProps<typeof Dialog>) {
  const isMobile = useIsMobile()
  return isMobile ? <Sheet {...props} /> : <Dialog {...props} />
}

export function ResponsiveDialogTrigger(props: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useIsMobile()
  return isMobile ? <SheetTrigger {...props} /> : <DialogTrigger {...props} />
}

export function ResponsiveDialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogContent>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <SheetContent
        side="bottom"
        className={cn(
          'max-h-[90vh] overflow-y-auto rounded-t-3xl border-t bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3',
          className
        )}
        {...props}
      >
        <div className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-slate-300" aria-hidden="true" />
        {children}
      </SheetContent>
    )
  }

  return <DialogContent className={cn('w-[calc(100vw-2rem)] sm:w-full', className)} {...props}>{children}</DialogContent>
}

export function ResponsiveDialogHeader(props: React.ComponentProps<typeof DialogHeader>) {
  const isMobile = useIsMobile()
  return isMobile ? <SheetHeader {...props} /> : <DialogHeader {...props} />
}

export function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const isMobile = useIsMobile()
  return isMobile ? <SheetTitle {...props} /> : <DialogTitle {...props} />
}

export function ResponsiveDialogFooter(props: React.ComponentProps<typeof DialogFooter>) {
  const isMobile = useIsMobile()
  return isMobile ? <SheetFooter {...props} /> : <DialogFooter {...props} />
}
