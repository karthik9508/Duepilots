'use client'

import {
  currencyOptions,
  getCurrencyOption,
  setStoredCurrency,
  useCurrency,
  type CurrencyCode,
} from '@/utils/currency'

export function CurrencySettings() {
  const currency = useCurrency()
  const selectedCurrency = getCurrencyOption(currency)

  return (
    <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Currency
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Choose the currency symbol used for customer balances and reminder messages.
          </p>
        </div>
        <div className="inline-flex w-fit items-center rounded-md bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
          {selectedCurrency.symbol} {selectedCurrency.code}
        </div>
      </div>

      <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Currency symbol
      </label>
      <select
        value={currency}
        onChange={(event) => setStoredCurrency(event.target.value as CurrencyCode)}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
      >
        {currencyOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.symbol} {option.code} - {option.name}
          </option>
        ))}
      </select>
    </section>
  )
}
