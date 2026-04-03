'use client'

import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CreditCard, Landmark, CheckCircle2, Loader2 } from 'lucide-react'
import { useSettleDebt } from '@/lib/queries/useCustomers'

interface DebtSettleDialogProps {
  customerId: string
  currentDebt: number
  staffId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DebtSettleDialog({ customerId, currentDebt, staffId, open, onOpenChange }: DebtSettleDialogProps) {
  const settleDebt = useSettleDebt()
  const [amount, setAmount] = useState<string>(currentDebt.toString())
  const [method, setMethod] = useState<'cash' | 'upi' | 'card'>('cash')

  const handleSettle = async () => {
    const settleAmt = parseFloat(amount)
    if (isNaN(settleAmt) || settleAmt <= 0) return
    
    await settleDebt.mutateAsync({ customerId, amount: settleAmt, staffId })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <div className="mx-auto bg-amber-50 dark:bg-amber-900/20 p-3 rounded-full mb-4">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
          </div>
          <DialogTitle className="text-center font-bold text-xl">Settle Customer Debt</DialogTitle>
          <DialogDescription className="text-center">
            Record a payment to reduce or clear the current debt of <span className="font-bold text-red-600">₹{currentDebt.toLocaleString()}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Amount to Settle (₹)</Label>
            <Input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-lg font-bold bg-zinc-50 dark:bg-zinc-900"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Landmark },
                { id: 'upi', label: 'UPI', icon: CreditCard },
                { id: 'card', label: 'Card', icon: CreditCard }
              ].map((m) => (
                <Button
                  key={m.id}
                  variant={method === m.id ? 'default' : 'outline'}
                  className={`h-16 flex-col gap-1 transition-all ${method === m.id ? 'bg-[#CCFF00] text-black hover:bg-[#bce600] border-[#CCFF00]' : 'bg-transparent text-zinc-600'}`}
                  onClick={() => setMethod(m.id as any)}
                >
                  <m.icon className="h-4 w-4" />
                  <span className="text-[10px] uppercase font-black">{m.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="flex-1 bg-black text-white hover:bg-zinc-800 rounded-xl h-12 gap-2" 
            onClick={handleSettle}
            disabled={settleDebt.isPending}
          >
            {settleDebt.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Confirm Settlement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
