'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  value: string // 'yyyy-mm-dd' or ''
  onChange: (value: string) => void
  required?: boolean
  className?: string
  placeholder?: string
}

// Timezone-safe local date parser to prevent month/day shifts
function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date()
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10) - 1
    const d = parseInt(parts[2], 10)
    return new Date(y, m, d)
  }
  return new Date()
}

// Timezone-safe local date to string helper
function getLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DatePicker({ value, onChange, required, className = '', placeholder = 'Select date' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Parse currently selected date or default to today for grid navigation timezone-safely
  const parsedDate = value ? parseLocalDate(value) : new Date()
  const [navDate, setNavDate] = useState(parsedDate)

  // Sync navDate when value changes externally
  useEffect(() => {
    if (value) {
      setNavDate(parseLocalDate(value))
    }
  }, [value])

  // Close calendar popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Format date for display: e.g. "May 26, 2026"
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return placeholder
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

  // Calendar calculations
  const year = navDate.getFullYear()
  const month = navDate.getMonth() // 0-indexed

  // First day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay()
  
  // Total days in the month
  const totalDays = new Date(year, month + 1, 0).getDate()

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Month navigation handlers
  const prevMonth = () => {
    setNavDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setNavDate(new Date(year, month + 1, 1))
  }

  // Handle day selection
  const selectDay = (day: number) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const selectedDateStr = `${year}-${m}-${d}`
    onChange(selectedDateStr)
    setIsOpen(false)
  }

  // Render the calendar grid
  const renderDays = () => {
    const days = []
    
    // Empty cells for preceding days of the week
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />)
    }

    // Days grid cells
    const todayStr = getLocalDateString(new Date())
    
    for (let d = 1; d <= totalDays; d++) {
      const currentM = String(month + 1).padStart(2, '0')
      const currentD = String(d).padStart(2, '0')
      const dateStr = `${year}-${currentM}-${currentD}`
      
      const isSelected = dateStr === value
      const isToday = dateStr === todayStr

      days.push(
        <button
          key={`day-${d}`}
          type="button"
          onClick={() => selectDay(d)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
            isSelected
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : isToday
              ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-blue-500/30'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
          }`}
        >
          {d}
        </button>
      )
    }

    return days
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Date trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold h-[38px] transition-all"
      >
        <span className={value ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500 font-normal'}>
          {formatDateDisplay(value)}
        </span>
        <CalendarIcon size={16} className="text-zinc-400 dark:text-zinc-500" />
      </button>

      {/* Hidden input to support standard HTML form validation (required) */}
      <input
        type="text"
        required={required}
        value={value}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
      />

      {/* Dropdown Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 w-72">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              {monthsList[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span key={day} className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">
                {day}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 justify-items-center">
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  )
}
