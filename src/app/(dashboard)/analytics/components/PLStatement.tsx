import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'

interface PLStatementProps {
  data: {
    rentalIncome: number
    penalties: number
    refunds: number
    totalRevenue: number
    expenseByCategory: Record<string, number>
    totalExpenses: number
    netProfit: number
    profitMargin: number
    depositsHeld: number
  }
}

function fmt(n: number) {
  return n.toLocaleString('en-IN')
}

export function PLStatement({ data }: PLStatementProps) {
  const isProfit = data.netProfit >= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
          {isProfit
            ? <TrendingUp className="w-4 h-4 text-emerald-600" />
            : <TrendingDown className="w-4 h-4 text-red-600" />
          }
          P&L Statement
          <span className="ml-1 text-xs font-normal text-slate-500">(Owner View)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Revenue</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Rental Income</span>
              <span className="font-medium text-slate-900">₹{fmt(data.rentalIncome)}</span>
            </div>
            {data.penalties > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Penalties Collected</span>
                <span className="font-medium text-slate-900">₹{fmt(data.penalties)}</span>
              </div>
            )}
            {data.refunds > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Refunds Issued</span>
                <span className="font-medium text-red-600">-₹{fmt(data.refunds)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-slate-100">
            <span className="text-slate-700">TOTAL REVENUE</span>
            <span className="text-slate-900">₹{fmt(data.totalRevenue)}</span>
          </div>
        </div>

        <Separator />

        {/* Expenses */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Expenses</p>
          {Object.keys(data.expenseByCategory).length === 0 ? (
            <p className="text-sm text-slate-400 italic">No expenses recorded</p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(data.expenseByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-slate-600 capitalize">{cat.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-slate-900">₹{fmt(amt)}</span>
                  </div>
                ))}
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-slate-100">
            <span className="text-slate-700">TOTAL EXPENSES</span>
            <span className="text-red-600">₹{fmt(data.totalExpenses)}</span>
          </div>
        </div>

        <Separator />

        {/* Net Profit */}
        <div className={`rounded-lg p-3 ${isProfit ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <span className={`text-sm font-semibold ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}>
              Net Profit
            </span>
            <span className={`text-lg font-bold ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}>
              {isProfit ? '' : '-'}₹{fmt(Math.abs(data.netProfit))}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-slate-500">Profit Margin</span>
            <span className={`text-xs font-medium ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
              {data.profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Deposits Note */}
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Deposits held (₹{fmt(data.depositsHeld)}) are not counted as revenue — they are refundable.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
