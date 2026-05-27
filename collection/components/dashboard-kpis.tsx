'use client'

import { formatCurrency, useCurrency } from '@/utils/currency'

interface DashboardKPIsProps {
  totalOutstanding: number
  totalReceived: number
  avgDelayDays: number
}

export function DashboardKPIs({ totalOutstanding, totalReceived, avgDelayDays }: DashboardKPIsProps) {
  const currency = useCurrency()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Total Outstanding</h3>
        <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {formatCurrency(totalOutstanding, currency)}
        </p>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Total Received</h3>
        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(totalReceived, currency)}
        </p>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Avg Delay Payments</h3>
        <p className="text-3xl font-bold text-red-600 dark:text-red-400">
          {avgDelayDays > 0 ? `${avgDelayDays.toFixed(1)} days` : '0 days'}
        </p>
      </div>
    </div>
  )
}
