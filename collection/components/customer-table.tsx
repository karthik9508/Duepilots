'use client'

import { useState, useRef } from 'react'
import { toPng, toBlob } from 'html-to-image'
import { ReminderCardExport } from '@/components/reminder-card-export'
import { Customer, updateReminderStage, updateCustomerBalances, sendEmailReminder } from '@/app/actions'
import { ReminderStage, generateMessage } from '@/utils/templates'
import { formatCurrency, useCurrency } from '@/utils/currency'
import { MessageCircle, Mail, ChevronDown, Download, Loader2, Pencil, Check, X, PlusCircle, DollarSign, Calendar } from 'lucide-react'
import { DatePicker } from '@/components/date-picker'

export function CustomerTable({ initialCustomers }: { initialCustomers: Customer[] }) {
  const currency = useCurrency()
  const [customers, setCustomers] = useState(initialCustomers)
  const [activeCustomerAction, setActiveCustomerAction] = useState<string | null>(null)
  
  // Edit State
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ outstanding: '', received_amount: '', due_date: '', received_date: '', payment_terms_days: '' })

  // Search, Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'outstanding' | 'settled'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'outstanding' | 'due_date' | 'created_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Send Reminder Modal State
  const [sendingReminderCustomerId, setSendingReminderCustomerId] = useState<string | null>(null)
  const [selectedReminderStage, setSelectedReminderStage] = useState<ReminderStage>('formal_polite')

  // Record Transaction State
  const [recordingTxCustomerId, setRecordingTxCustomerId] = useState<string | null>(null)
  const [txType, setTxType] = useState<'invoice' | 'payment'>('payment')
  const [txAmount, setTxAmount] = useState('')
  const [txDate, setTxDate] = useState('')
  const [isSubmittingTx, setIsSubmittingTx] = useState(false)

  // Date Formatting Helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const year = parts[0]
      const monthIndex = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${months[monthIndex]} ${day}, ${year}`
      }
    }
    return dateStr
  }

  // Timezone-safe date addition helper
  const addDays = (dateStr: string, days: number): string => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    
    const date = new Date(year, month, day)
    date.setDate(date.getDate() + days)
    
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Days Status Helper
  const getDaysStatus = (dueDateStr: string | null, outstanding: number) => {
    if (outstanding <= 0 || !dueDateStr) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDateStr)
    due.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays < 0) {
      return { type: 'overdue', days: Math.abs(diffDays) }
    } else if (diffDays === 0) {
      return { type: 'today', days: 0 }
    } else {
      return { type: 'upcoming', days: diffDays }
    }
  }

  const startEditing = (customer: Customer) => {
    setEditingCustomerId(customer.id)
    setEditForm({
      outstanding: customer.outstanding.toString(),
      received_amount: customer.received_amount.toString(),
      due_date: customer.due_date || '',
      received_date: customer.received_date || '',
      payment_terms_days: customer.payment_terms_days?.toString() || '30'
    })
    setActiveCustomerAction(null)
  }

  const cancelEditing = () => {
    setEditingCustomerId(null)
  }

  const saveEditing = async (customerId: string) => {
    const outstanding = parseFloat(editForm.outstanding) || 0
    const received_amount = parseFloat(editForm.received_amount) || 0
    const due_date = editForm.due_date || null
    const received_date = editForm.received_date || null
    const payment_terms_days = parseInt(editForm.payment_terms_days, 10) || 30
    
    // Total invoice value is outstanding + received
    const invoice_amount = outstanding + received_amount

    // Compute delay days dynamically
    let delay_days = 0
    if (outstanding > 0 && due_date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(due_date)
      due.setHours(0, 0, 0, 0)
      if (today > due) {
        const diffTime = today.getTime() - due.getTime()
        delay_days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      }
    }

    // Optimistic update
    setCustomers(customers.map(c => c.id === customerId ? { ...c, outstanding, received_amount, delay_days, due_date, received_date, invoice_amount, payment_terms_days } : c))
    setEditingCustomerId(null)

    try {
      await updateCustomerBalances(customerId, outstanding, received_amount, delay_days, due_date, received_date, invoice_amount, payment_terms_days)
    } catch (error) {
      console.error('Failed to update balances', error)
      alert('Failed to save balances.')
    }
  }

  const openRecordingTx = (customer: Customer) => {
    setRecordingTxCustomerId(customer.id)
    setTxType('payment')
    setTxAmount('')
    setTxDate(new Date().toISOString().split('T')[0])
    setActiveCustomerAction(null)
  }

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recordingTxCustomerId) return

    const customer = customers.find(c => c.id === recordingTxCustomerId)
    if (!customer) return

    const amount = parseFloat(txAmount) || 0
    if (amount <= 0) {
      alert('Please enter a valid positive amount.')
      return
    }

    setIsSubmittingTx(true)

    try {
      let newOutstanding = customer.outstanding
      let newReceivedAmount = customer.received_amount
      let newDueDate = customer.due_date
      let newReceivedDate = customer.received_date
      let newInvoiceAmount = customer.invoice_amount || (customer.outstanding + customer.received_amount)

      if (txType === 'invoice') {
        newOutstanding += amount
        newInvoiceAmount += amount
        newDueDate = txDate ? addDays(txDate, customer.payment_terms_days || 30) : null
      } else {
        // Payment Credit
        newOutstanding = Math.max(0, customer.outstanding - amount)
        newReceivedAmount += amount
        newReceivedDate = txDate || null
        if (newOutstanding === 0) {
          newDueDate = null
        }
      }

      // Compute dynamic delay days
      let delay_days = 0
      if (newOutstanding > 0 && newDueDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const due = new Date(newDueDate)
        due.setHours(0, 0, 0, 0)
        if (today > due) {
          const diffTime = today.getTime() - due.getTime()
          delay_days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        }
      }

      // Optimistic update
      setCustomers(customers.map(c => c.id === recordingTxCustomerId ? {
        ...c,
        outstanding: newOutstanding,
        received_amount: newReceivedAmount,
        due_date: newDueDate,
        received_date: newReceivedDate,
        delay_days,
        invoice_amount: newInvoiceAmount
      } : c))

      await updateCustomerBalances(recordingTxCustomerId, newOutstanding, newReceivedAmount, delay_days, newDueDate, newReceivedDate, newInvoiceAmount)
      setRecordingTxCustomerId(null)
    } catch (error) {
      console.error('Failed to record transaction:', error)
      alert('Failed to record transaction.')
    } finally {
      setIsSubmittingTx(false)
    }
  }
  
  // PNG Export State
  const exportRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportData, setExportData] = useState<{
    customerName: string
    outstandingLabel: string
    message: string
    stageLabel: string
  } | null>(null)
  
  const handleStageSelect = async (customer: Customer, stage: ReminderStage, type: 'whatsapp' | 'email' | 'png') => {
    setActiveCustomerAction(null)
    
    // Generate message
    const message = generateMessage(stage, {
      name: customer.name,
      outstanding: customer.outstanding,
      outstandingLabel: formatCurrency(customer.outstanding, currency),
    })
    
    if (type === 'whatsapp') {
      const phone = customer.phone?.replace(/[^0-9]/g, '') || ''
      if (!phone) {
        alert('No valid phone number for this customer.')
        return
      }

      setIsExporting(true)
      setExportData({
        customerName: customer.name,
        outstandingLabel: formatCurrency(customer.outstanding, currency),
        message,
        stageLabel: getStageLabel(stage)
      })

      // Wait for React to render the hidden card
      setTimeout(async () => {
        if (exportRef.current) {
          try {
            const blob = await toBlob(exportRef.current, { quality: 1, pixelRatio: 2 })
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ])
              alert('Image copied to clipboard! Just paste it in the WhatsApp chat.')
            }
          } catch (err) {
            console.error('Failed to export PNG to clipboard', err)
          }
        }
        setIsExporting(false)
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
      }, 300)

      // Update backend (optimistically update UI first)
      try {
        setCustomers(customers.map(c => c.id === customer.id ? { ...c, reminder_stage: stage } : c))
        await updateReminderStage(customer.id, stage)
      } catch (error) {
        console.error('Failed to update stage', error)
        alert('Failed to save the reminder stage.')
      }

    } else if (type === 'email') {
      const email = customer.email || ''
      if (!email) {
        alert('No email address for this customer.')
        return
      }

      // Optimistically update UI
      setCustomers(customers.map(c => c.id === customer.id ? { ...c, reminder_stage: stage } : c))

      try {
        const res = await sendEmailReminder(customer.id, stage)
        if (res.success) {
          alert(res.message)
        }
      } catch (err: any) {
        console.error('Failed to send email reminder:', err)
        alert(err.message || 'Failed to send email reminder via Resend.')
      }

    } else if (type === 'png') {
      setIsExporting(true)
      setExportData({
        customerName: customer.name,
        outstandingLabel: formatCurrency(customer.outstanding, currency),
        message,
        stageLabel: getStageLabel(stage)
      })
      
      // Wait for React to render the hidden card
      setTimeout(async () => {
        if (exportRef.current) {
          try {
            const dataUrl = await toPng(exportRef.current, { quality: 1, pixelRatio: 2 })
            const link = document.createElement('a')
            link.download = `Reminder_${customer.name.replace(/\s+/g, '_')}.png`
            link.href = dataUrl
            link.click()
          } catch (err) {
            console.error('Failed to export PNG', err)
            alert('Failed to export PNG image.')
          }
        }
        setIsExporting(false)
      }, 300)

      // Update backend (optimistically update UI first)
      try {
        setCustomers(customers.map(c => c.id === customer.id ? { ...c, reminder_stage: stage } : c))
        await updateReminderStage(customer.id, stage)
      } catch (error) {
        console.error('Failed to update stage', error)
        alert('Failed to save the reminder stage.')
      }
    }
  }

  const getStageLabel = (stage: ReminderStage) => {
    switch (stage) {
      case 'cold': return 'Friendly'
      case 'business_formal': return 'Professional (Formal)'
      case 'formal_polite': return 'Professional'
      case 'polite_harsh': return 'Urgent'
      default: return 'None'
    }
  }

  const getStageColor = (stage: ReminderStage) => {
    switch (stage) {
      case 'cold': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
      case 'business_formal': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
      case 'formal_polite': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
      case 'polite_harsh': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
      default: return 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
      customer.name.toLowerCase().includes(term) ||
      (customer.email && customer.email.toLowerCase().includes(term)) ||
      (customer.phone && customer.phone.toLowerCase().includes(term))

    if (statusFilter === 'outstanding') {
      return matchesSearch && customer.outstanding > 0
    }
    if (statusFilter === 'settled') {
      return matchesSearch && customer.outstanding === 0 && customer.received_amount > 0
    }
    return matchesSearch
  })

  const sortedAndFilteredCustomers = [...filteredCustomers].sort((a, b) => {
    let aVal: any = a[sortBy]
    let bVal: any = b[sortBy]

    if (sortBy === 'name') {
      aVal = a.name.toLowerCase()
      bVal = b.name.toLowerCase()
    } else if (sortBy === 'outstanding') {
      aVal = a.outstanding
      bVal = b.outstanding
    } else if (sortBy === 'due_date') {
      aVal = a.due_date ? new Date(a.due_date).getTime() : 0
      bVal = b.due_date ? new Date(b.due_date).getTime() : 0
    } else if (sortBy === 'created_at') {
      aVal = new Date(a.created_at || 0).getTime()
      bVal = new Date(b.created_at || 0).getTime()
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Search, Filter & Sort Controls */}
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-zinc-50/40 dark:bg-zinc-950/30 backdrop-blur-md">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold transition-all duration-200"
          />
        </div>

        {/* Filter & Sort Controls Group */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Status Tabs */}
          <div className="inline-flex rounded-xl p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 shadow-inner">
            {(['all', 'outstanding', 'settled'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black capitalize tracking-wider transition-all duration-200 ${
                  statusFilter === filter
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs border border-zinc-200/10 scale-[1.02]'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="outstanding">Sort by Outstanding</option>
              <option value="due_date">Sort by Due Date</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
              title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

        </div>
      </div>

      <div className="w-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 shadow-xs border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Contact Info</th>
              <th className="px-3 py-3">Outstanding</th>
              <th className="px-3 py-3">Due Date</th>
              <th className="px-3 py-3">Received</th>
              <th className="px-3 py-3">Payment Date</th>
              <th className="px-3 py-3">Last Reminder</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {sortedAndFilteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-zinc-500 font-medium">
                  No matching customers found.
                </td>
              </tr>
            ) : (
              sortedAndFilteredCustomers.map((customer) => {
                const daysStatus = getDaysStatus(customer.due_date, customer.outstanding)

                return (
                  <tr key={customer.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30 transition-all border-b border-zinc-200/60 dark:border-zinc-800/60">
                    <td className="px-3 py-3 relative font-bold text-zinc-900 dark:text-zinc-50">
                      {/* Colorful Status Pillar Indicator */}
                      <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-md transition-all ${
                        daysStatus?.type === 'overdue' ? 'bg-rose-500 shadow-md shadow-rose-500/20' :
                        daysStatus?.type === 'today' ? 'bg-amber-500 animate-pulse' :
                        customer.outstanding === 0 && customer.received_amount > 0 ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' :
                        customer.outstanding > 0 ? 'bg-blue-500 shadow-md shadow-blue-500/20' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`} />
                      <div className="pl-2.5">{customer.name}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col text-zinc-500 dark:text-zinc-400 font-semibold text-xs space-y-1">
                        {customer.phone && <span className="flex items-center"><MessageCircle size={12} className="mr-1.5 text-zinc-400" /> {customer.phone}</span>}
                        {customer.email && <span className="flex items-center font-medium"><Mail size={12} className="mr-1.5 text-zinc-400" /> {customer.email}</span>}
                        {!customer.phone && !customer.email && <span className="text-zinc-400 italic text-[11px] font-normal">No contact info</span>}
                      </div>
                    </td>
                    {editingCustomerId === customer.id ? (
                      <>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.outstanding}
                            onChange={(e) => setEditForm({...editForm, outstanding: e.target.value})}
                            className="w-24 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 text-xs font-bold text-zinc-900 dark:text-white"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col space-y-1.5">
                            <DatePicker
                              value={editForm.due_date}
                              onChange={(val) => setEditForm({...editForm, due_date: val})}
                              className="w-36"
                            />
                            <select
                              value={editForm.payment_terms_days}
                              onChange={(e) => setEditForm({...editForm, payment_terms_days: e.target.value})}
                              className="w-36 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 text-xs font-bold text-zinc-900 dark:text-white h-[32px]"
                            >
                              <option value="15">Net 15</option>
                              <option value="30">Net 30</option>
                              <option value="45">Net 45</option>
                              <option value="60">Net 60</option>
                              <option value="90">Net 90</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.received_amount}
                            onChange={(e) => setEditForm({...editForm, received_amount: e.target.value})}
                            className="w-24 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 text-xs font-bold text-zinc-900 dark:text-white"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <DatePicker
                            value={editForm.received_date}
                            onChange={(val) => setEditForm({...editForm, received_date: val})}
                            className="w-36"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-3 font-extrabold text-sm">
                          {customer.outstanding > 0 ? (
                            <span className={daysStatus?.type === 'overdue' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}>
                              {formatCurrency(customer.outstanding, currency)}
                            </span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-600 font-medium">
                              {formatCurrency(0, currency)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col space-y-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-zinc-950 dark:text-zinc-50 font-bold text-xs">{formatDate(customer.due_date)}</span>
                              {customer.outstanding > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/30">
                                  Net {customer.payment_terms_days || 30}
                                </span>
                              )}
                            </div>
                            {daysStatus && (
                              <div className="flex flex-wrap gap-1.5">
                                {daysStatus.type === 'overdue' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20">
                                    ⚠️ {daysStatus.days} days late
                                  </span>
                                )}
                                {daysStatus.type === 'today' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20 animate-pulse">
                                    ● Due Today
                                  </span>
                                )}
                                {daysStatus.type === 'upcoming' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/10">
                                    ⏳ {daysStatus.days} days left
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {customer.received_amount > 0 ? (
                            <span>{formatCurrency(customer.received_amount, currency)}</span>
                          ) : (
                            <span className="text-zinc-300 dark:text-zinc-700 font-medium text-xs">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-zinc-700 dark:text-zinc-300 text-xs">
                          {customer.received_amount > 0 && customer.received_date ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                              ✓ {formatDate(customer.received_date)}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">-</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${getStageColor(customer.reminder_stage)}`}>
                        {getStageLabel(customer.reminder_stage)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right relative">
                      {editingCustomerId === customer.id ? (
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => saveEditing(customer.id)}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl transition-all shadow-xs border border-emerald-200/20"
                            title="Save"
                          >
                            <Check size={14} className="stroke-[3]" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-2 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl transition-all border border-zinc-200/20"
                            title="Cancel"
                          >
                            <X size={14} className="stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => openRecordingTx(customer)}
                            className="p-2 text-emerald-600 hover:text-white hover:bg-emerald-600 dark:text-emerald-400 dark:hover:text-white dark:hover:bg-emerald-600 rounded-xl transition-all border border-emerald-200/30 hover:border-emerald-600 shadow-xs"
                            title="Record Transaction (Payment/Invoice)"
                          >
                            <PlusCircle size={15} />
                          </button>
                          <button
                            onClick={() => startEditing(customer)}
                            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-zinc-200/20"
                            title="Edit Balances & Dates"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSendingReminderCustomerId(customer.id)
                              setSelectedReminderStage('formal_polite')
                            }}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-extrabold text-xs shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
                          >
                            <span>Send Reminder</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Hidden Export Template */}
      {exportData && (
        <ReminderCardExport
          ref={exportRef}
          customerName={exportData.customerName}
          outstandingLabel={exportData.outstandingLabel}
          message={exportData.message}
          stageLabel={exportData.stageLabel}
        />
      )}

      {/* Send Reminder Modal */}
      {sendingReminderCustomerId && (() => {
        const customer = customers.find(c => c.id === sendingReminderCustomerId)
        if (!customer) return null

        const previewMessage = generateMessage(selectedReminderStage, {
          name: customer.name,
          outstanding: customer.outstanding,
          outstandingLabel: formatCurrency(customer.outstanding, currency),
        })

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden scale-in duration-200 text-left flex flex-col">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-lg flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                    Send Payment Reminder
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-semibold">To {customer.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSendingReminderCustomerId(null)}
                  className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                
                {/* Contact Info Badges */}
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {customer.phone ? (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      <MessageCircle size={12} className="mr-1.5 text-green-600" /> {customer.phone}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                      ⚠️ No phone saved
                    </span>
                  )}
                  {customer.email ? (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      <Mail size={12} className="mr-1.5 text-blue-500" /> {customer.email}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                      ⚠️ No email saved
                    </span>
                  )}
                </div>

                {/* Tone Tabs */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                    Choose Communication Tone
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    {(['cold', 'formal_polite', 'polite_harsh'] as ReminderStage[]).map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setSelectedReminderStage(stage)}
                        className={`py-2 px-1 rounded-lg font-bold text-xs capitalize transition-all ${
                          selectedReminderStage === stage
                            ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm border border-zinc-200/10'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                        }`}
                      >
                        {getStageLabel(stage)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Preview Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Message Template Preview
                    </label>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedReminderStage === 'cold' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                      selectedReminderStage === 'formal_polite' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {getStageLabel(selectedReminderStage)} Tone
                    </span>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 text-sm font-medium whitespace-pre-wrap font-sans max-h-40 overflow-y-auto leading-relaxed shadow-inner">
                    {previewMessage}
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                    Choose Dispatch Channel
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* WhatsApp */}
                    <button
                      type="button"
                      disabled={!customer.phone || isExporting}
                      onClick={() => handleStageSelect(customer, selectedReminderStage, 'whatsapp')}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/5 dark:hover:bg-emerald-950/15 text-emerald-700 dark:text-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
                    >
                      <MessageCircle size={20} className="mb-1 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">WhatsApp</span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Send message</span>
                    </button>

                    {/* Email */}
                    <button
                      type="button"
                      disabled={!customer.email || isExporting}
                      onClick={() => handleStageSelect(customer, selectedReminderStage, 'email')}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-100 dark:border-blue-950/20 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/5 dark:hover:bg-blue-950/15 text-blue-700 dark:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
                    >
                      <Mail size={20} className="mb-1 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">Send Email</span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Deliver automated email</span>
                    </button>

                    {/* PNG Export */}
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => handleStageSelect(customer, selectedReminderStage, 'png')}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-purple-100 dark:border-purple-950/20 bg-purple-50/50 hover:bg-purple-50 dark:bg-purple-950/5 dark:hover:bg-purple-950/15 text-purple-700 dark:text-purple-400 transition-colors disabled:opacity-40 group"
                    >
                      {isExporting ? (
                        <Loader2 size={20} className="mb-1 text-purple-600 animate-spin" />
                      ) : (
                        <Download size={20} className="mb-1 text-purple-600 group-hover:scale-110 transition-transform" />
                      )}
                      <span className="text-xs font-bold">Download PNG</span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Save picture card</span>
                    </button>

                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 text-right">
                <button
                  type="button"
                  onClick={() => setSendingReminderCustomerId(null)}
                  className="py-2.5 px-6 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Close Panel
                </button>
              </div>

            </div>
          </div>
        )
      })()}

      {/* Record Transaction Modal */}
      {recordingTxCustomerId && (() => {
        const customer = customers.find(c => c.id === recordingTxCustomerId)
        if (!customer) return null

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden scale-in duration-200 text-left">
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">Record Transaction</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">For {customer.name}</p>
                </div>
                <button
                  onClick={() => setRecordingTxCustomerId(null)}
                  className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 p-2 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setTxType('payment'); setTxDate(new Date().toISOString().split('T')[0]); }}
                  className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                    txType === 'payment'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  Payment Received (Credit)
                </button>
                <button
                  type="button"
                  onClick={() => { setTxType('invoice'); setTxDate(new Date().toISOString().split('T')[0]); }}
                  className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                    txType === 'invoice'
                      ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  Invoice Added (Debit)
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleRecordTransaction} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {txType === 'payment' ? 'Payment Amount' : 'Invoice Amount'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 font-medium text-sm">
                      {formatCurrency(0, currency).replace(/[0-9.,\s]/g, '')}
                    </div>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {txType === 'payment' ? 'Payment Received Date' : 'Invoice Date'}
                  </label>
                  <DatePicker
                    required
                    value={txDate}
                    onChange={(val) => setTxDate(val)}
                  />
                  {txType === 'invoice' && (
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1 pl-1">
                      Calculated Due Date: {formatDate(addDays(txDate, customer.payment_terms_days || 30))} (based on Net {customer.payment_terms_days || 30})
                    </p>
                  )}
                </div>

                {/* Info summary */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-xs space-y-2 font-medium">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Current Outstanding:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">{formatCurrency(customer.outstanding, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Current Received:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">{formatCurrency(customer.received_amount, currency)}</span>
                  </div>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 my-2 pt-2 flex justify-between font-bold text-sm">
                    <span>New Outstanding:</span>
                    <span className={txType === 'payment' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}>
                      {formatCurrency(
                        txType === 'payment'
                          ? Math.max(0, customer.outstanding - (parseFloat(txAmount) || 0))
                          : customer.outstanding + (parseFloat(txAmount) || 0),
                        currency
                      )}
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRecordingTxCustomerId(null)}
                    className="flex-1 py-2.5 px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTx}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-colors flex items-center justify-center ${
                      txType === 'payment'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                    }`}
                  >
                    {isSubmittingTx ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : txType === 'payment' ? (
                      'Record Payment'
                    ) : (
                      'Record Invoice'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

