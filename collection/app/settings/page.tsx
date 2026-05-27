import { Bell, Mail, MessageCircle, ShieldCheck } from 'lucide-react'
import { CurrencySettings } from '@/components/currency-settings'
import { logout } from '@/app/auth/actions'

const settingsSections = [
  {
    title: 'Reminder channels',
    description: 'WhatsApp and email actions are available from the customer table.',
    icon: MessageCircle,
  },
  {
    title: 'Email defaults',
    description: 'Payment reminder subjects and messages use the configured templates.',
    icon: Mail,
  },
  {
    title: 'Notifications',
    description: 'Keep this workspace ready for follow-up alerts and customer updates.',
    icon: Bell,
  },
  {
    title: 'Access',
    description: 'Protect customer payment details and review team permissions here.',
    icon: ShieldCheck,
  },
]

export default function SettingsPage() {
  return (
    <div className="p-4 font-sans sm:p-8 md:p-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Settings
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Configure how your collection workspace handles reminders and team preferences.
          </p>
        </header>

        <CurrencySettings />

        <section className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => {
            const Icon = section.icon

            return (
              <article
                key={section.title}
                className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="mb-4 grid size-10 place-items-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {section.title}
                </h2>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {section.description}
                </p>
              </article>
            )
          })}
        </section>

        {/* Account & Session Controls */}
        <section className="mt-8 border-t border-zinc-200 dark:border-zinc-800/80 pt-8">
          <div className="rounded-xl border border-rose-200 dark:border-rose-950/40 bg-rose-50/10 dark:bg-rose-950/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                <ShieldCheck className="text-rose-500" size={20} /> Terminate Active Session
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                Log out of this collection workspace securely. Your dashboard and client lists will remain protected.
              </p>
            </div>
            <div>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-rose-500/10 hover:shadow-rose-500/20 active:scale-[0.98] cursor-pointer"
                >
                  Log Out
                </button>
              </form>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
