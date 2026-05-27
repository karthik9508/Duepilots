'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type AuthFormState = {
  message?: string
}

function getCredentials(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  return { email, password }
}

export async function login(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const credentials = getCredentials(formData)

  if ('error' in credentials) {
    return { message: credentials.error }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(credentials)

  if (error) {
    return { message: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const credentials = getCredentials(formData)

  if ('error' in credentials) {
    return { message: credentials.error }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp(credentials)

  if (error) {
    return { message: error.message }
  }

  if (!data.session) {
    return { message: 'Account created. Check your email to confirm your signup.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
