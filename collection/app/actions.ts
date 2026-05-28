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

export async function sendEmailReminder(
  customerId: string,
  stage: ReminderStage
): Promise<{ success: boolean; message: string }> {
  const { supabase, user } = await getAuthenticatedClient()

  // 1. Fetch customer details
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !customer) {
    console.error('Error fetching customer for email reminder:', fetchError)
    throw new Error('Failed to retrieve customer details.')
  }

  const email = customer.email?.trim()
  if (!email) {
    throw new Error('Customer does not have a registered email address.')
  }

  // 2. Validate Resend API configuration
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    throw new Error(
      'Resend API key is not configured. Please set RESEND_API_KEY in your deployment environment variables.'
    )
  }

  // 3. Import template builders dynamically to optimize server load
  const { generateHtmlTemplate } = await import('@/utils/email-templates')
  const { generateMessage } = await import('@/utils/templates')

  const bodyText = generateMessage(stage, {
    name: customer.name,
    outstanding: Number(customer.outstanding),
  })

  const htmlBody = generateHtmlTemplate(stage, {
    name: customer.name,
    outstanding: Number(customer.outstanding),
    invoiceAmount: Number(customer.invoice_amount),
    receivedAmount: Number(customer.received_amount),
    delayDays: Number(customer.delay_days),
    dueDate: customer.due_date,
    payUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://duepilots.vercel.app',
    businessName: 'Duepilots Reminders',
  })

  const emailSubject = stage === 'polite_harsh'
    ? `URGENT: Outstanding Balance Reminder - ${customer.name}`
    : `Friendly Reminder: Outstanding Payment Due - ${customer.name}`

  // 4. Send email using Resend
  const { Resend } = await import('resend')
  const resend = new Resend(resendApiKey)
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  // Resend Sandbox Restriction Bypass:
  // If sending from onboarding@resend.dev (unverified free tier), Resend strictly blocks sending to 
  // third-party emails. We automatically redirect the email to the logged-in user's own address 
  // so they can preview the premium HTML template in their own inbox!
  const isSandbox = fromEmail === 'onboarding@resend.dev'
  const recipientEmail = isSandbox && user.email ? user.email : email

  const { data, error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: [recipientEmail],
    subject: emailSubject,
    text: bodyText,
    html: htmlBody,
  })

  if (sendError) {
    console.error('Resend delivery failed:', sendError)
    throw new Error(`Email delivery failed: ${sendError.message}`)
  }

  // 5. Update reminder stage in DB
  const { error: updateError } = await supabase
    .from('customers')
    .update({ reminder_stage: stage })
    .eq('id', customerId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error updating customer reminder stage:', updateError)
  }

  revalidatePath('/')

  return {
    success: true,
    message: isSandbox
      ? `Resend Sandbox Delivery: The email reminder has been successfully redirected and delivered to your inbox (${recipientEmail}) for previewing!`
      : `Email reminder delivered successfully to ${email} (ID: ${data?.id})`,
  }
}

