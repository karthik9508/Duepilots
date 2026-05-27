'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { LogIn, UserPlus } from 'lucide-react'
import type { AuthFormState } from '@/app/auth/actions'

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>
  mode: 'login' | 'signup'
}

const initialState: AuthFormState = {}

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const isLogin = mode === 'login'
  const Icon = isLogin ? LogIn : UserPlus

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          minLength={6}
          required
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          placeholder="Minimum 6 characters"
        />
      </div>

      {state.message && (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon className="size-4" aria-hidden="true" />
        {pending ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
        <Link
          href={isLogin ? '/signup' : '/login'}
          className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          {isLogin ? 'Sign up' : 'Log in'}
        </Link>
      </p>
    </form>
  )
}
