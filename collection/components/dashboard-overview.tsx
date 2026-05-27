'use client'

import { useState, useRef, useEffect } from 'react'
import { toPng, toBlob } from 'html-to-image'
import { ReminderCardExport } from '@/components/reminder-card-export'
import { Customer, updateReminderStage, updateCustomerBalances } from '@/app/actions'
import { ReminderStage, generateMessage } from '@/utils/templates'
import { formatCurrency, useCurrency } from '@/utils/currency'
import { 
  MessageCircle, 
  Mail, 
  ChevronDown, 
  Download, 
  Loader2, 
  Pencil, 
  Check, 
  X, 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign, 
  Sparkles, 
  AlertTriangle, 
  ArrowUpRight, 
  Filter, 
  Activity, 
  Calendar, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react'

interface DashboardOverviewProps {
  initialCustomers: Customer[]
}

export function DashboardOverview({ initialCustomers }: DashboardOverviewProps) {
  const currency = useCurrency()
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [selectedAgingFilter, setSelectedAgingFilter] = useState<string | null>(null)
  const [activeCustomerAction, setActiveCustomerAction] = useState<string | null>(null)
  
  // Date rendering
  const [formattedDate, setFormattedDate] = useState('')
  useEffect(() => {
    setFormattedDate(new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date()))
  }, [])

  // Sync state if initialCustomers change
  useEffect(() => {
    setCustomers(initialCustomers)
  }, [initialCustomers])

  // Dynamic delay days calculation on the client side
  const computedCustomers = customers.map(c => {
    let delay_days = 0
    if (c.outstanding > 0 && c.due_date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(c.due_date)
      due.setHours(0, 0, 0, 0)
      if (today > due) {
        const diffTime = today.getTime() - due.getTime()
        delay_days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      }
    }
    return { ...c, delay_days }
  })

  // Calculations
  const totalOutstanding = computedCustomers.reduce((sum, c) => sum + c.outstanding, 0)
  const totalReceived = computedCustomers.reduce((sum, c) => sum + (c.received_amount || 0), 0)
  const totalInvoiced = totalOutstanding + totalReceived
  const recoveryRate = totalInvoiced > 0 ? (totalReceived / totalInvoiced) * 100 : 0
  const activeDebtorsCount = computedCustomers.filter(c => c.outstanding > 0).length
  
  const customersWithDelay = computedCustomers.filter(c => c.outstanding > 0 && (c.delay_days || 0) > 0)
  const avgDelayDays = customersWithDelay.length > 0 
    ? customersWithDelay.reduce((sum, c) => sum + (c.delay_days || 0), 0) / customersWithDelay.length 
    : 0

  // Overdue and Upcoming metrics calculations for MVP alignment
  const overdueCustomers = computedCustomers.filter(c => c.outstanding > 0 && (c.delay_days || 0) > 0)
  const totalOverdue = overdueCustomers.reduce((sum, c) => sum + c.outstanding, 0)
  const overdueCount = overdueCustomers.length

  const upcomingCustomers = computedCustomers.filter(c => c.outstanding > 0 && (c.delay_days || 0) === 0)
  const totalUpcoming = upcomingCustomers.reduce((sum, c) => sum + c.outstanding, 0)
  const upcomingCount = upcomingCustomers.length

  // Aging brackets computations
  const agingCurrent = computedCustomers.filter(c => c.outstanding > 0 && c.delay_days === 0)
  const aging1to15 = computedCustomers.filter(c => c.outstanding > 0 && c.delay_days > 0 && c.delay_days <= 15)
  const aging16to30 = computedCustomers.filter(c => c.outstanding > 0 && c.delay_days > 15 && c.delay_days <= 30)
  const agingOver30 = computedCustomers.filter(c => c.outstanding > 0 && c.delay_days > 30)

  const amtCurrent = agingCurrent.reduce((sum, c) => sum + c.outstanding, 0)
  const amt1to15 = aging1to15.reduce((sum, c) => sum + c.outstanding, 0)
  const amt16to30 = aging16to30.reduce((sum, c) => sum + c.outstanding, 0)
  const amtOver30 = agingOver30.reduce((sum, c) => sum + c.outstanding, 0)

  const agingBrackets = [
    { key: 'current', label: 'Current', amount: amtCurrent, count: agingCurrent.length, color: 'from-emerald-400 to-teal-500', darkColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { key: '1-15', label: '1-15 Days', amount: amt1to15, count: aging1to15.length, color: 'from-amber-400 to-orange-500', darkColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { key: '16-30', label: '16-30 Days', amount: amt16to30, count: aging16to30.length, color: 'from-orange-500 to-red-500', darkColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { key: '30+', label: '30+ Days', amount: amtOver30, count: agingOver30.length, color: 'from-red-500 to-rose-600', darkColor: 'bg-red-500/20 text-red-400 border-red-500/30' }
  ]

  const maxBracketAmt = Math.max(...agingBrackets.map(b => b.amount), 1)

  // Risk Distribution calculations
  const lowRiskAmt = computedCustomers.filter(c => c.outstanding > 0 && c.delay_days <= 7).reduce((sum, c) => sum + c.outstanding, 0)
  const medRiskAmt = computedCustomers.filter(c => c.outstanding > 0 && c.delay_days > 7 && c.delay_days <= 30).reduce((sum, c) => sum + c.outstanding, 0)
  const highRiskAmt = computedCustomers.filter(c => c.outstanding > 0 && c.delay_days > 30).reduce((sum, c) => sum + c.outstanding, 0)
  const totalRiskAmt = lowRiskAmt + medRiskAmt + highRiskAmt
  const lowRiskPct = totalRiskAmt > 0 ? (lowRiskAmt / totalRiskAmt) * 100 : 0
  const medRiskPct = totalRiskAmt > 0 ? (medRiskAmt / totalRiskAmt) * 100 : 0
  const highRiskPct = totalRiskAmt > 0 ? (highRiskAmt / totalRiskAmt) * 100 : 0

  // Filtered customers for focus list
  let focusedCustomers = [...computedCustomers].filter(c => c.outstanding > 0)
  if (selectedAgingFilter) {
    if (selectedAgingFilter === 'current') {
      focusedCustomers = focusedCustomers.filter(c => c.delay_days === 0)
    } else if (selectedAgingFilter === '1-15') {
      focusedCustomers = focusedCustomers.filter(c => c.delay_days > 0 && c.delay_days <= 15)
    } else if (selectedAgingFilter === '16-30') {
      focusedCustomers = focusedCustomers.filter(c => c.delay_days > 15 && c.delay_days <= 30)
    } else if (selectedAgingFilter === '30+') {
      focusedCustomers = focusedCustomers.filter(c => c.delay_days > 30)
    }
  }

  // Sort outstanding descending
  focusedCustomers.sort((a, b) => b.outstanding - a.outstanding)
  const topDebtors = focusedCustomers.slice(0, 5)

  // AI-Driven Collection Insights Generation
  const generateInsights = () => {
    const insights = []
    
    // Recovery Rate Insight
    if (recoveryRate > 75) {
      insights.push({
        type: 'success',
        icon: CheckCircle2,
        title: 'Excellent Recovery Rate',
        message: `Your current Recovery Rate of ${recoveryRate.toFixed(1)}% is healthy and exceeds the standard industry benchmark of 75%. Outstanding cashflow is highly optimized.`
      })
    } else if (recoveryRate > 50) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Moderate Recovery Pace',
        message: `Recovery rate stands at ${recoveryRate.toFixed(1)}%. Accelerate cashflow by setting up automated 'Professional' reminders for accounts approaching 15 days delay.`
      })
    } else {
      insights.push({
        type: 'danger',
        icon: AlertCircle,
        title: 'Urgent Credit Attention',
        message: `Recovery rate is currently low at ${recoveryRate.toFixed(1)}%. We recommend prioritizing accounts with outstanding balances and organizing regular follow-ups.`
      })
    }

    // High Risk Concentration Insight
    if (amtOver30 > 0) {
      insights.push({
        type: 'danger',
        icon: AlertCircle,
        title: 'Overdue Liquidity Risk',
        message: `${formatCurrency(amtOver30, currency)} outstanding is overdue by 30+ days across ${agingOver30.length} account(s). These are classified as High Risk. Trigger immediate 'Urgent' warnings.`
      })
    }

    // Top Debtor concentration risk
    const sortedOutstanding = [...computedCustomers].filter(c => c.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding)
    if (sortedOutstanding.length > 0) {
      const topOne = sortedOutstanding[0]
      const concentration = (topOne.outstanding / totalOutstanding) * 100
      if (concentration > 35 && totalOutstanding > 0) {
        insights.push({
          type: 'info',
          icon: Sparkles,
          title: 'Debtor Concentration Risk',
          message: `Single-account exposure: ${topOne.name} represents ${concentration.toFixed(0)}% of your entire outstanding receivables (${formatCurrency(topOne.outstanding, currency)}). Consider custom contact.`
        })
      }
    }

    // General collection advice
    if (computedCustomers.length > 0 && totalOutstanding === 0) {
      insights.push({
        type: 'success',
        icon: CheckCircle2,
        title: 'Zero Outstanding Balances',
        message: 'Perfect score! All client invoicing is fully resolved. Keep up the brilliant collections work.'
      })
    }

    return insights
  }

  const insightsList = generateInsights()

  // Debtors Action State - PNG, WA, Email
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

      setTimeout(async () => {
        if (exportRef.current) {
          try {
            const blob = await toBlob(exportRef.current, { quality: 1, pixelRatio: 2 })
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ])
              alert('Reminder card image copied to clipboard! Paste it inside the WhatsApp chat.')
            }
          } catch (err) {
            console.error('Failed to copy PNG to clipboard', err)
          }
        }
        setIsExporting(false)
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
      }, 300)

    } else if (type === 'email') {
      const email = customer.email || ''
      if (!email) {
        alert('No email address for this customer.')
        return
      }
      window.open(`mailto:${email}?subject=Payment Reminder&body=${encodeURIComponent(message)}`, '_blank')
    } else if (type === 'png') {
      setIsExporting(true)
      setExportData({
        customerName: customer.name,
        outstandingLabel: formatCurrency(customer.outstanding, currency),
        message,
        stageLabel: getStageLabel(stage)
      })
      
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
    }

    try {
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, reminder_stage: stage } : c))
      await updateReminderStage(customer.id, stage)
    } catch (error) {
      console.error('Failed to update stage in DB', error)
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
      case 'cold': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30'
      case 'business_formal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/30'
      case 'formal_polite': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30'
      case 'polite_harsh': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200/50 dark:border-red-800/30'
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50'
    }
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. Header Hero section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-sm">
        <div className="absolute right-0 top-0 w-[300px] h-[300px] bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            <Calendar size={14} />
            <span>{formattedDate || 'Loading calendar...'}</span>
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wider uppercase">Live Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500">
            Collections Center
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xl">
            Real-time balance monitoring, client aging analysis, and automated collection templates.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Debtors</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{activeDebtorsCount}</span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Total Clients</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{customers.length}</span>
          </div>
        </div>
      </div>

      {/* 2. Premium KPI Cards Suite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Pending Amount */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Pending Amount</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {formatCurrency(totalOutstanding, currency)}
            </h3>
            <div className="flex items-center space-x-2 mt-2">
              <span className="h-2 w-2 bg-blue-500 rounded-full" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Total receivables awaiting resolution
              </p>
            </div>
          </div>
        </div>

        {/* Overdue Payments */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Overdue Payments</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
              {formatCurrency(totalOverdue, currency)}
            </h3>
            <div className="flex items-center space-x-2 mt-2">
              <span className="h-2 w-2 bg-rose-500 rounded-full shrink-0" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
                {overdueCount} overdue customer account(s)
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Dues */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Upcoming Dues</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {formatCurrency(totalUpcoming, currency)}
            </h3>
            <div className="flex items-center space-x-2 mt-2">
              <span className="h-2 w-2 bg-amber-500 rounded-full shrink-0" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
                {upcomingCount} account(s) in payment terms
              </p>
            </div>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Collected</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(totalReceived, currency)}
            </h3>
            <div className="flex items-center space-x-2 mt-2">
              <span className="h-2 w-2 bg-emerald-500 rounded-full" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Successfully processed in bank
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Aging Analysis Chart & Risk Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Aging Analysis Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                <Clock size={18} className="text-zinc-400" /> Payment Aging Analysis
              </h2>
              {selectedAgingFilter && (
                <button 
                  onClick={() => setSelectedAgingFilter(null)}
                  className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline gap-1"
                >
                  <Filter size={10} /> Clear Filter
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              Outstanding distribution by delay days. Click any bracket to filter focus list.
            </p>
          </div>

          {/* SVG / Div-based Custom Vertical Bar Chart */}
          <div className="grid grid-cols-4 gap-4 h-48 items-end border-b border-zinc-100 dark:border-zinc-800/80 pb-2 mb-2">
            {agingBrackets.map((bracket) => {
              const isSelected = selectedAgingFilter === bracket.key
              const percent = totalOutstanding > 0 ? (bracket.amount / totalOutstanding) * 100 : 0
              const heightPct = totalOutstanding > 0 ? (bracket.amount / maxBracketAmt) * 85 + 15 : 15 // min 15% for visual appeal
              
              return (
                <div 
                  key={bracket.key}
                  onClick={() => setSelectedAgingFilter(isSelected ? null : bracket.key)}
                  className={`flex flex-col items-center justify-end h-full relative cursor-pointer group transition-all duration-300`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-10 font-bold whitespace-nowrap text-center">
                    <span className="block">{bracket.count} Client(s)</span>
                    <span className="block text-indigo-400 dark:text-indigo-600 font-extrabold">{formatCurrency(bracket.amount, currency)}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{percent.toFixed(0)}% of total</span>
                  </div>

                  {/* Animated Bar Pill */}
                  <div 
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[56px] rounded-t-xl bg-gradient-to-t ${bracket.color} transition-all duration-500 shadow-sm ${
                      selectedAgingFilter 
                        ? isSelected 
                          ? 'opacity-100 ring-4 ring-indigo-500/20 dark:ring-indigo-400/30' 
                          : 'opacity-30 hover:opacity-50' 
                        : 'opacity-90 group-hover:opacity-100'
                    }`}
                  />
                </div>
              )
            })}
          </div>

          {/* Labels & Details */}
          <div className="grid grid-cols-4 gap-2 text-center pt-2">
            {agingBrackets.map((bracket) => {
              const isSelected = selectedAgingFilter === bracket.key
              return (
                <div 
                  key={bracket.key}
                  onClick={() => setSelectedAgingFilter(isSelected ? null : bracket.key)}
                  className={`cursor-pointer transition-colors p-1.5 rounded-lg ${
                    isSelected 
                      ? 'bg-zinc-100 dark:bg-zinc-800/80 font-bold' 
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                  }`}
                >
                  <span className="block text-[10px] sm:text-xs font-bold text-zinc-600 dark:text-zinc-300 truncate">
                    {bracket.label}
                  </span>
                  <span className="block text-[11px] sm:text-sm font-black text-zinc-900 dark:text-white mt-0.5 truncate">
                    {formatCurrency(bracket.amount, currency)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column stacking panel */}
        <div className="flex flex-col gap-6">
          
          {/* Risk Distribution Profile */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2 mb-1">
                <AlertTriangle size={18} className="text-zinc-400" /> Credit Risk Distribution
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                Outstanding capital segmented by payment security indicators.
              </p>
            </div>

            <div className="space-y-6">
              {/* Horizontal segmented risk bar */}
              <div>
                <div className="flex h-4 w-full rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/80">
                  {totalRiskAmt > 0 ? (
                    <>
                      <div 
                        style={{ width: `${lowRiskPct}%` }} 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        title={`Low Risk: ${lowRiskPct.toFixed(0)}%`} 
                      />
                      <div 
                        style={{ width: `${medRiskPct}%` }} 
                        className="bg-amber-400 h-full transition-all duration-500" 
                        title={`Medium Risk: ${medRiskPct.toFixed(0)}%`} 
                      />
                      <div 
                        style={{ width: `${highRiskPct}%` }} 
                        className="bg-rose-500 h-full transition-all duration-500" 
                        title={`High Risk: ${highRiskPct.toFixed(0)}%`} 
                      />
                    </>
                  ) : (
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-full flex items-center justify-center text-[10px] text-zinc-400">
                      No active balances
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed legend items */}
              <div className="space-y-3">
                {/* Low Risk */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">Low Risk (≤7 days overdue)</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(lowRiskAmt, currency)} ({lowRiskPct.toFixed(0)}%)
                  </span>
                </div>

                {/* Med Risk */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">Medium Risk (8-30 days)</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(medRiskAmt, currency)} ({medRiskPct.toFixed(0)}%)
                  </span>
                </div>

                {/* High Risk */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">High Risk (&gt;30 days)</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(highRiskAmt, currency)} ({highRiskPct.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
              * High-risk accounts are vulnerable to delayed liquidity or default. Escalate communication immediately.
            </div>
          </div>

          {/* Card 2: Collection Performance (Circular Gauge & Delay) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
            
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2 mb-1">
                <Activity size={18} className="text-zinc-400" /> Collection Performance
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                Liquidity recovery speed and credit delay statistics.
              </p>
            </div>

            <div className="space-y-6">
              {/* Circular Gauge */}
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="26" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      className="stroke-indigo-500 dark:stroke-indigo-400 transition-all duration-1000 ease-out" 
                      strokeWidth="6" 
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - (recoveryRate || 0) / 100)}
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                    {recoveryRate.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Recovery Efficiency</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {recoveryRate > 75 ? 'Optimal collection speed' : recoveryRate > 50 ? 'Requires general review' : 'High attention needed'}
                  </p>
                </div>
              </div>

              {/* Settlement Delay */}
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <div className="flex items-center space-x-2 text-xs">
                  <Clock size={14} className="text-zinc-400 shrink-0" />
                  <span className="font-semibold text-zinc-600 dark:text-zinc-300">Avg Settlement Delay:</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white block">
                    {avgDelayDays > 0 ? `${avgDelayDays.toFixed(1)} days` : '0 days'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border mt-1 ${
                    avgDelayDays > 30 ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' :
                    avgDelayDays > 15 ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' :
                    'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                  }`}>
                    {avgDelayDays > 30 ? 'High credit exposure' : avgDelayDays > 15 ? 'Moderate delay aging' : 'Healthy payment terms'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. AI-Driven Credit Copilot Insights */}
      <div className="bg-linear-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-zinc-900/40 dark:via-zinc-900/60 dark:to-indigo-950/10 border border-indigo-100 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
            Collection Copilot & Insights
          </h2>
          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Autonomous Analysis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insightsList.map((insight, idx) => {
            const Icon = insight.icon
            let borderClass = 'border-zinc-100 dark:border-zinc-800'
            let bgClass = 'bg-white/80 dark:bg-zinc-950/20'
            let textClass = 'text-zinc-500 dark:text-zinc-400'
            let titleClass = 'text-zinc-900 dark:text-white'

            if (insight.type === 'success') {
              borderClass = 'border-emerald-100 dark:border-emerald-950/40'
              bgClass = 'bg-emerald-50/20 dark:bg-emerald-950/5'
              textClass = 'text-emerald-700/80 dark:text-emerald-300/80'
              titleClass = 'text-emerald-900 dark:text-emerald-100'
            } else if (insight.type === 'danger') {
              borderClass = 'border-red-100 dark:border-red-950/40'
              bgClass = 'bg-red-50/20 dark:bg-red-950/5'
              textClass = 'text-red-700/80 dark:text-red-300/80'
              titleClass = 'text-red-900 dark:text-red-100'
            } else if (insight.type === 'warning') {
              borderClass = 'border-amber-100 dark:border-amber-950/40'
              bgClass = 'bg-amber-50/20 dark:bg-amber-950/5'
              textClass = 'text-amber-700/80 dark:text-amber-300/80'
              titleClass = 'text-amber-900 dark:text-amber-100'
            }

            return (
              <div 
                key={idx} 
                className={`flex gap-3 border ${borderClass} ${bgClass} rounded-xl p-4 transition-all duration-300 hover:shadow-xs`}
              >
                <Icon size={18} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className={`text-xs sm:text-sm font-bold ${titleClass}`}>
                    {insight.title}
                  </h4>
                  <p className={`text-xs leading-relaxed ${textClass}`}>
                    {insight.message}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. Accounts Focus List with Quick Reminders */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Section Title */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users size={18} className="text-zinc-400" /> Collections Focus List
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Top outstanding accounts based on delay. Direct client actions enabled below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedAgingFilter && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50`}>
                <Filter size={10} /> Active Aging: {selectedAgingFilter === 'current' ? 'Current' : selectedAgingFilter === '1-15' ? '1-15 Days' : selectedAgingFilter === '16-30' ? '16-30 Days' : '30+ Days'}
                <button onClick={() => setSelectedAgingFilter(null)} className="hover:text-red-500 ml-0.5 font-black">×</button>
              </span>
            )}
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Showing {topDebtors.length} account(s)
            </span>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-950/80 text-zinc-500 dark:text-zinc-400 font-semibold text-xs tracking-wider uppercase border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Outstanding Bal</th>
                <th className="px-6 py-4">Received Amount</th>
                <th className="px-6 py-4">Days Overdue</th>
                <th className="px-6 py-4">Communication Status</th>
                <th className="px-6 py-4 text-right">Quick Contact Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {topDebtors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic">
                    {selectedAgingFilter 
                      ? 'No debtor accounts fit this aging category filter.' 
                      : 'Excellent! No client accounts have overdue balances.'}
                  </td>
                </tr>
              ) : (
                topDebtors.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-950/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-white">{customer.name}</div>
                      <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {customer.phone || customer.email ? (
                          <span>{customer.phone || ''} {customer.phone && customer.email ? '•' : ''} {customer.email || ''}</span>
                        ) : (
                          <span className="italic text-zinc-400/80">No contact info saved</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(customer.outstanding, currency)}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(customer.received_amount || 0, currency)}
                    </td>
                    <td className="px-6 py-4">
                      {customer.delay_days > 0 ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-md font-bold ${
                          customer.delay_days > 30 
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' 
                            : customer.delay_days > 15 
                              ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400' 
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        }`}>
                          {customer.delay_days} days overdue
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic text-xs">Current (No delay)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStageColor(customer.reminder_stage)}`}>
                        {getStageLabel(customer.reminder_stage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={() => setActiveCustomerAction(activeCustomerAction === customer.id ? null : customer.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl transition-colors font-bold text-xs border border-zinc-200/50 dark:border-zinc-700/50 shadow-2xs"
                      >
                        <span>Select reminder tone</span>
                        <ChevronDown size={12} />
                      </button>
                      
                      {activeCustomerAction === customer.id && (
                        <div className="absolute right-6 top-12 mt-1 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-10 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="px-3 py-1.5 text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left border-b border-zinc-50 dark:border-zinc-800/80 mb-1">
                            Choose Communication Tone
                          </div>
                          
                          {(['cold', 'business_formal', 'formal_polite', 'polite_harsh'] as ReminderStage[]).map((stage) => (
                            <div 
                              key={stage} 
                              className="px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group text-left transition-colors"
                            >
                              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                                <span>{getStageLabel(stage)}</span>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                  stage === 'cold' ? 'bg-blue-400' : stage === 'business_formal' ? 'bg-purple-400' : stage === 'formal_polite' ? 'bg-amber-400' : 'bg-red-400'
                                }`} />
                              </div>
                              <div className="flex space-x-2 mt-1.5">
                                <button 
                                  onClick={() => handleStageSelect(customer, stage, 'whatsapp')}
                                  disabled={!customer.phone || isExporting}
                                  className="flex-1 flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 py-1 rounded-md text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-100 dark:border-emerald-950/20"
                                >
                                  <MessageCircle size={10} className="mr-1 shrink-0" /> WA
                                </button>
                                <button 
                                  onClick={() => handleStageSelect(customer, stage, 'email')}
                                  disabled={!customer.email || isExporting}
                                  className="flex-1 flex items-center justify-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:bg-indigo-950/40 py-1 rounded-md text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-indigo-100 dark:border-indigo-950/20"
                                >
                                  <Mail size={10} className="mr-1 shrink-0" /> Mail
                                </button>
                                <button 
                                  onClick={() => handleStageSelect(customer, stage, 'png')}
                                  disabled={isExporting}
                                  className="flex-1 flex items-center justify-center bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:hover:bg-purple-950/40 py-1 rounded-md text-[10px] font-bold transition-colors disabled:opacity-40 border border-purple-100 dark:border-purple-950/20"
                                >
                                  {isExporting && activeCustomerAction === customer.id ? (
                                    <Loader2 size={10} className="mr-1 animate-spin shrink-0" />
                                  ) : (
                                    <Download size={10} className="mr-1 shrink-0" />
                                  )} 
                                  PNG
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Hidden Export Template for canvas capture */}
      {exportData && (
        <ReminderCardExport
          ref={exportRef}
          customerName={exportData.customerName}
          outstandingLabel={exportData.outstandingLabel}
          message={exportData.message}
          stageLabel={exportData.stageLabel}
        />
      )}

    </div>
  )
}
