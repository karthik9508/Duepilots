'use server'

import { createClient } from '@/utils/supabase/server'
import { ReminderStage } from '@/utils/templates'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type Customer = {
  id: string
  user_id: string
  name: string
  phone: string | null
  email: string | null
  invoice_amount: number
  outstanding: number
  received_amount: number
  delay_days: number
  payment_terms_days: number
  reminder_stage: ReminderStage
  due_date: string | null
  received_date: string | null
  created_at: string
}

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { supabase, user }
}

export async function addCustomers(customers: { name: string, phone?: string, email?: string, outstanding: number, received_amount?: number, delay_days?: number, payment_terms_days?: number, due_date?: string | null, received_date?: string | null, invoice_amount?: number }[]) {
  const { supabase, user } = await getAuthenticatedClient()
  const customersWithUser = customers.map((customer) => ({
    ...customer,
    invoice_amount: customer.invoice_amount !== undefined ? customer.invoice_amount : customer.outstanding + (customer.received_amount || 0),
    payment_terms_days: customer.payment_terms_days !== undefined ? customer.payment_terms_days : 30,
    user_id: user.id,
  }))

  const { error } = await supabase
    .from('customers')
    .insert(customersWithUser)

  if (error) {
    console.error('Error inserting customers:', error)
    throw new Error('Failed to insert customers')
  }

  revalidatePath('/')
}

export async function updateReminderStage(customerId: string, stage: ReminderStage) {
  const { supabase, user } = await getAuthenticatedClient()

  const { error } = await supabase
    .from('customers')
    .update({ reminder_stage: stage })
    .eq('id', customerId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating customer:', error)
    throw new Error('Failed to update reminder stage')
  }

  revalidatePath('/')
}

export async function updateCustomerBalances(
  customerId: string,
  outstanding: number,
  received_amount: number,
  delay_days: number,
  due_date: string | null,
  received_date: string | null,
  invoice_amount: number,
  payment_terms_days?: number
) {
  const { supabase, user } = await getAuthenticatedClient()

  const updatePayload: Record<string, any> = {
    outstanding,
    received_amount,
    delay_days,
    due_date,
    received_date,
    invoice_amount,
  }

  if (payment_terms_days !== undefined) {
    updatePayload.payment_terms_days = payment_terms_days
  }

  const { error } = await supabase
    .from('customers')
    .update(updatePayload)
    .eq('id', customerId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating customer balances:', error)
    throw new Error('Failed to update customer balances')
  }

  revalidatePath('/')
}

export async function getCustomers(): Promise<Customer[]> {
  const { supabase, user } = await getAuthenticatedClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return data as Customer[]
}
