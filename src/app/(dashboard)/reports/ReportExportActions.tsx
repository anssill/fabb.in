'use client'

import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const REPORTS = [
  ['bookings', 'Bookings and receivables'],
  ['inventory', 'Physical inventory'],
  ['customers', 'Customers'],
  ['payments', 'Financial entries'],
  ['expenses', 'Expenses'],
  ['unavailable', 'Damaged and missing'],
] as const

export function ReportExportActions() {
  return <div className="flex gap-2 print:hidden">
    <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print / PDF</Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button><Download className="mr-2 h-4 w-4" />Export CSV</Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">{REPORTS.map(([key, label]) => <DropdownMenuItem key={key} asChild><a href={`/api/reports/export?report=${key}`} download>{label}</a></DropdownMenuItem>)}</DropdownMenuContent>
    </DropdownMenu>
  </div>
}
