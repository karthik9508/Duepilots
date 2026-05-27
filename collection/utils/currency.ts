import { useSyncExternalStore } from 'react'

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'AED'

export const currencyOptions: {
  code: CurrencyCode
  name: string
  symbol: string
  locale: string
}[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', locale: 'en-AE' },
]

const storageKey = 'collection.currency'
const defaultCurrency: CurrencyCode = 'USD'

function isCurrencyCode(value: string | null): value is CurrencyCode {
  return currencyOptions.some((option) => option.code === value)
}

function getStoredCurrency(): CurrencyCode {
  if (typeof window === 'undefined') {
    return defaultCurrency
  }

  const value = window.localStorage.getItem(storageKey)
  return isCurrencyCode(value) ? value : defaultCurrency
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('currencychange', callback)

  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('currencychange', callback)
  }
}

export function setStoredCurrency(currency: CurrencyCode) {
  window.localStorage.setItem(storageKey, currency)
  window.dispatchEvent(new Event('currencychange'))
}

export function useCurrency() {
  return useSyncExternalStore(subscribe, getStoredCurrency, () => defaultCurrency)
}

export function getCurrencyOption(currency: CurrencyCode) {
  return currencyOptions.find((option) => option.code === currency) ?? currencyOptions[0]
}

export function formatCurrency(amount: number, currency: CurrencyCode) {
  const option = getCurrencyOption(currency)

  return new Intl.NumberFormat(option.locale, {
    style: 'currency',
    currency,
  }).format(amount)
}
