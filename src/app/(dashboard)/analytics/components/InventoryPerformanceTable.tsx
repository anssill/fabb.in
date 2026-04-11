'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, Package } from 'lucide-react'

interface ItemPerformance {
  id: string
  name: string
  category: string
  revenue: number
  cost: number
  maintenanceExpenses: number
  totalCost: number
  netProfit: number
  roi: number
  total_rentals: number
}

interface PerformanceProps {
  data: ItemPerformance[]
}

export function InventoryPerformanceTable({ data }: PerformanceProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          Inventory ROI Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="font-semibold text-xs">Item Name</TableHead>
              <TableHead className="font-semibold text-xs">Category</TableHead>
              <TableHead className="font-semibold text-xs text-right">Revenue</TableHead>
              <TableHead className="font-semibold text-xs text-right">Cost</TableHead>
              <TableHead className="font-semibold text-xs text-right">Maint. Exp.</TableHead>
              <TableHead className="font-semibold text-xs text-right">Net Profit</TableHead>
              <TableHead className="font-semibold text-xs text-right">ROI (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-slate-500 text-sm">
                  No inventory data matching filter
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-sm">
                    {item.name}
                    <div className="text-[10px] text-slate-400 font-normal">
                      {item.total_rentals} bookings
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-medium capitalize">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    ₹{item.revenue.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right text-slate-500 text-sm">
                    ₹{item.cost.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right text-amber-600 text-sm">
                    ₹{item.maintenanceExpenses.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className={`text-right font-semibold text-sm ${item.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    ₹{item.netProfit.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 font-semibold text-sm">
                      {item.roi > 0 ? (
                        <span className="text-emerald-600 flex items-center">
                          <ArrowUpRight className="w-3 h-3" />
                          {item.roi}%
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          {item.roi}%
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
