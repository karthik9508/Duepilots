import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { Upload, Plus, FileText, X } from 'lucide-react'
import { addCustomers } from '@/app/actions'
import { getCurrencyOption, useCurrency } from '@/utils/currency'
import { DatePicker } from '@/components/date-picker'

type CustomerCsvRow = Record<string, string | undefined>

type NewCustomer = {
  name: string
  phone: string | undefined
  email: string | undefined
  outstanding: number
  received_amount: number
  delay_days: number
  payment_terms_days: number
  due_date: string | null
  received_date: string | null
}

const csvFieldAliases = {
  name: ['name', 'customername', 'fullname', 'clientname'],
  phone: ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'contactnumber'],
  email: ['email', 'emailaddress'],
  outstanding: ['outstanding', 'outstandingbalance', 'balance', 'amount', 'amountdue', 'due', 'totaldue'],
  received_amount: ['received', 'receivedamount', 'paid', 'paidamount'],
  delay_days: ['delay', 'delaydays', 'dayslate', 'late'],
  due_date: ['duedate', 'due_date', 'deadline', 'date_due', 'datedue', 'pay_by'],
  received_date: ['receiveddate', 'received_date', 'paymentdate', 'payment_date', 'paid_date', 'paiddate'],
  payment_terms_days: ['paymentterms', 'payment_terms', 'terms', 'payment_terms_days', 'terms_days', 'termsdays', 'period', 'payment_period'],
  invoice_date: ['invoicedate', 'invoice_date', 'billdate', 'bill_date', 'date'],
}

// Timezone-safe date addition helper
function addDays(dateStr: string, days: number): string {
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

function parsePaymentTermsDays(value: string | undefined): number {
  if (!value) return 30
  const match = value.match(/(\d+)/)
  if (match) {
    const days = parseInt(match[1], 10)
    if (!isNaN(days) && days >= 0) return days
  }
  return 30
}

function safeParseDate(value: string | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  return date.toISOString().split('T')[0]
}

function normalizeCsvKey(value: string) {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function getCsvValue(row: CustomerCsvRow, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[alias]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
}

function parseCurrencyValue(value: string | undefined) {
  if (!value) return Number.NaN

  const isNegative = /^\(.*\)$/.test(value.trim())
  const normalized = value.replace(/[^0-9.-]/g, '')
  const amount = Number.parseFloat(normalized)

  return isNegative ? -amount : amount
}

export function CustomerEntry() {
  const router = useRouter()
  const currency = useCurrency()
  const currencyOption = getCurrencyOption(currency)
  const [activeTab, setActiveTab] = useState<'csv' | 'manual'>('manual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Manual entry state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [outstanding, setOutstanding] = useState('')
  const [receivedAmount, setReceivedAmount] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [paymentTermsType, setPaymentTermsType] = useState('30') // '15', '30', '45', '60', '90', 'custom'
  const [customPaymentTermsDays, setCustomPaymentTermsDays] = useState('30')
  const [dueDate, setDueDate] = useState('')
  const [receivedDate, setReceivedDate] = useState('')

  // Set default invoice date to today when outstanding balance is entered
  useEffect(() => {
    if (parseFloat(outstanding) > 0 && !invoiceDate) {
      setInvoiceDate(new Date().toISOString().split('T')[0])
    }
  }, [outstanding, invoiceDate])

  // Automatically compute Due Date when Invoice Date or Payment Terms change
  useEffect(() => {
    if (invoiceDate) {
      const termsDays = paymentTermsType === 'custom' 
        ? (parseInt(customPaymentTermsDays, 10) || 30) 
        : parseInt(paymentTermsType, 10)
      
      const calculatedDue = addDays(invoiceDate, termsDays)
      setDueDate(calculatedDue)
    }
  }, [invoiceDate, paymentTermsType, customPaymentTermsDays])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    
    try {
      const outstandingNum = parseFloat(outstanding) || 0
      const receivedNum = receivedAmount ? parseFloat(receivedAmount) : 0
      const termsDays = paymentTermsType === 'custom' 
        ? (parseInt(customPaymentTermsDays, 10) || 30) 
        : parseInt(paymentTermsType, 10)
      
      // Auto-compute delay days based on due date
      let computedDelayDays = 0
      if (outstandingNum > 0 && dueDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const due = new Date(dueDate)
        due.setHours(0, 0, 0, 0)
        if (today > due) {
          const diffTime = Math.abs(today.getTime() - due.getTime())
          computedDelayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
      }

      await addCustomers([{
        name,
        phone: phone || undefined,
        email: email || undefined,
        outstanding: outstandingNum,
        received_amount: receivedNum,
        delay_days: computedDelayDays,
        payment_terms_days: termsDays,
        due_date: dueDate || null,
        received_date: receivedDate || null,
      }])
      setMessage('Customer added successfully!')
      setName('')
      setPhone('')
      setEmail('')
      setOutstanding('')
      setReceivedAmount('')
      setInvoiceDate('')
      setPaymentTermsType('30')
      setCustomPaymentTermsDays('30')
      setDueDate('')
      setReceivedDate('')
      router.refresh()
    } catch {
      setMessage('Error adding customer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const input = e.currentTarget

    setIsSubmitting(true)
    setMessage('Parsing CSV...')

    Papa.parse<CustomerCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeCsvKey,
      complete: async (results: Papa.ParseResult<CustomerCsvRow>) => {
        try {
          const customers = results.data
            .map((row) => {
              const name = getCsvValue(row, csvFieldAliases.name)
              const outstanding = parseCurrencyValue(getCsvValue(row, csvFieldAliases.outstanding))
              const received_amount = parseCurrencyValue(getCsvValue(row, csvFieldAliases.received_amount)) || 0
              const payment_terms_days = parsePaymentTermsDays(getCsvValue(row, csvFieldAliases.payment_terms_days))
              const invoice_date = safeParseDate(getCsvValue(row, csvFieldAliases.invoice_date))
              
              let due_date = safeParseDate(getCsvValue(row, csvFieldAliases.due_date))
              const received_date = safeParseDate(getCsvValue(row, csvFieldAliases.received_date))
              
              // Smart due date calculation if not provided explicitly
              if (outstanding > 0 && !due_date) {
                const baseDate = invoice_date || new Date().toISOString().split('T')[0]
                due_date = addDays(baseDate, payment_terms_days)
              }
              
              let delay_days = 0
              if (outstanding > 0 && due_date) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const due = new Date(due_date)
                due.setHours(0, 0, 0, 0)
                if (today > due) {
                  const diffTime = Math.abs(today.getTime() - due.getTime())
                  delay_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                }
              }
              
              const customer = {
                name,
                phone: getCsvValue(row, csvFieldAliases.phone),
                email: getCsvValue(row, csvFieldAliases.email),
                outstanding,
                received_amount,
                delay_days,
                payment_terms_days,
                due_date,
                received_date,
              }

              return customer.name && !isNaN(customer.outstanding)
                ? ({ ...customer, name: customer.name } satisfies NewCustomer)
                : null
            })
            .filter((customer): customer is NewCustomer => customer !== null)
          const skippedRows = results.data.length - customers.length

          if (customers.length === 0) {
            setMessage('No valid customers found. Use columns like Name and Outstanding Balance.')
            setIsSubmitting(false)
            return
          }

          setMessage(`Uploading ${customers.length} customers...`)
          await addCustomers(customers)
          router.refresh()
          setMessage(
            skippedRows > 0
              ? `Added ${customers.length} customers. Skipped ${skippedRows} invalid rows.`
              : `Successfully added ${customers.length} customers!`
          )
        } catch {
          setMessage('Error uploading CSV data.')
        } finally {
          setIsSubmitting(false)
          input.value = ''
        }
      },
      error: (error) => {
        setMessage(`CSV Parsing Error: ${error.message}`)
        setIsSubmitting(false)
        input.value = ''
      }
    })
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm mb-8 w-full">
      <div className="flex items-center space-x-4 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'manual' 
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50' 
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
          }`}
        >
          <Plus size={18} />
          <span>Manual Entry</span>
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'csv' 
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50' 
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
          }`}
        >
          <FileText size={18} />
          <span>CSV Upload</span>
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-zinc-100 dark:bg-zinc-800 text-sm rounded-lg flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
            <X size={16} />
          </button>
        </div>
      )}

      {activeTab === 'manual' ? (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Outstanding Balance ({currencyOption.symbol})</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={outstanding}
                onChange={(e) => setOutstanding(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Received Amount ({currencyOption.symbol})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                placeholder="0.00"
              />
            </div>

            {parseFloat(outstanding) > 0 && (
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Invoice Date</label>
                  <DatePicker
                    required
                    value={invoiceDate}
                    onChange={(val) => setInvoiceDate(val)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Payment Terms</label>
                  <select
                    value={paymentTermsType}
                    onChange={(e) => setPaymentTermsType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold h-[38px]"
                  >
                    <option value="15">15 Days (Net 15)</option>
                    <option value="30">30 Days (Net 30)</option>
                    <option value="45">45 Days (Net 45)</option>
                    <option value="60">60 Days (Net 60)</option>
                    <option value="90">90 Days (Net 90)</option>
                    <option value="custom">Custom Days...</option>
                  </select>
                </div>
                {paymentTermsType === 'custom' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Custom Days</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={customPaymentTermsDays}
                      onChange={(e) => setCustomPaymentTermsDays(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Due Date (Calculated)</label>
                    <DatePicker
                      required
                      value={dueDate}
                      onChange={(val) => setDueDate(val)}
                    />
                  </div>
                )}
                {paymentTermsType === 'custom' && (
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Due Date (Calculated)</label>
                    <DatePicker
                      required
                      value={dueDate}
                      onChange={(val) => setDueDate(val)}
                    />
                  </div>
                )}
              </div>
            )}

            {parseFloat(receivedAmount) > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Payment Received Date</label>
                <DatePicker
                  required={parseFloat(receivedAmount) > 0}
                  value={receivedDate}
                  onChange={(val) => setReceivedDate(val)}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Phone (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md shadow-blue-500/10"
          >
            {isSubmitting ? 'Saving...' : 'Add Customer'}
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
          <Upload className="text-zinc-400 mb-4" size={48} />
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 text-center">
            Upload a CSV file containing columns: <br/>
            <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs mx-0.5">Name</span>, 
            <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs mx-0.5">Outstanding</span>, 
            <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs mx-0.5">Terms</span>, 
            <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs mx-0.5">Due Date</span>, 
            <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs mx-0.5">Received Date</span>
          </p>
          <a
            href="/sample-customers.csv"
            download
            className="mb-4 inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Download Demo CSV
          </a>
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
            Select CSV File
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isSubmitting}
            />
          </label>
        </div>
      )}
    </div>
  )
}
