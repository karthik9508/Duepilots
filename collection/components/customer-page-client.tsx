'use client'

import { useState, useEffect } from 'react'
import { CustomerEntry } from '@/components/customer-entry'
import { CustomerTable } from '@/components/customer-table'
import { Customer } from '@/app/actions'
import { formatCurrency, useCurrency } from '@/utils/currency'
import { Calendar, PlusCircle, X, ChevronDown } from 'lucide-react'

interface CustomerPageClientProps {
  initialCustomers: Customer[]
}

export function CustomerPageClient({ initialCustomers }: CustomerPageClientProps) {
  const currency = useCurrency()
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Keep state synced with server data
  useEffect(() => {
    setCustomers(initialCustomers)
    if (initialCustomers.length === 0) {
      setIsAddOpen(true)
    }
  }, [initialCustomers])

  return (
    <div className="p-4 font-sans sm:p-8 md:p-12 min-h-screen bg-zinc-50/50 dark:bg-black">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all duration-300">
          <div className="absolute right-0 top-0 w-[250px] h-[250px] bg-gradient-to-bl from-blue-500/5 to-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <span>Workspace Directory</span>
              <span className="h-1 w-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
              <span>CRM</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Customer Directory
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xl">
              Add new records, upload customer CSV spreadsheets, trace account balances, and record payments.
            </p>
          </div>
          <div>
            <button
              onClick={() => setIsAddOpen(!isAddOpen)}
              className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                isAddOpen
                  ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {isAddOpen ? (
                <>
                  <X size={16} />
                  <span>Close Intake Panel</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Add or Import Clients</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Customer Intake Drawer */}
        {isAddOpen && (
          <div className="animate-in slide-in-from-top-4 duration-300 ease-out">
            <CustomerEntry />
          </div>
        )}

        {/* Customer Directory Header & Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Customer Ledger ({customers.length})
            </h2>
          </div>

          <CustomerTable initialCustomers={customers} />
        </div>

      </div>
    </div>
  )
}
