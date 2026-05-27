import { AuthForm } from '@/components/auth-form'
import { signup } from '@/app/auth/actions'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create account
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Start managing customer balances and reminders.
          </p>
        </div>
        <AuthForm action={signup} mode="signup" />
      </div>
    </div>
  )
}
