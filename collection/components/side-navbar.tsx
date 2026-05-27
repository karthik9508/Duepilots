'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { logout } from '@/app/auth/actions'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function SideNavbar() {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  if (isAuthPage) {
    return null
  }

  return (
    <aside className="border-b border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95 sm:min-h-screen sm:w-64 sm:border-b-0 sm:border-r">
      <div className="flex h-full flex-col gap-6 px-4 py-4 sm:sticky sm:top-0 sm:px-5 sm:py-6">
        <Link href="/" className="flex items-center gap-3 rounded-md px-2 py-1.5">
          <span className="grid size-9 place-items-center rounded-md bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-50 dark:text-zinc-950">
            PC
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Payment Collection
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              Receivables workspace
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex gap-2 sm:flex-col">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 flex-1 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors sm:flex-none ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-950'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <form action={logout} className="mt-auto">
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
