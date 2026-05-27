'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, Users } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const links = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard
    },
    {
      name: 'Customers',
      href: '/reminders',
      icon: Users
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ]

  return (
    <div className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Payment App
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50'
              }`}
            >
              <Icon size={18} />
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
