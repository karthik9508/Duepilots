import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/service'
import { generateMessage, ReminderStage } from '@/utils/templates'
import { generateHtmlTemplate } from '@/utils/email-templates'
import { Resend } from 'resend'

// Allow both GET and POST requests for cron triggers and manual validation
export async function GET(request: NextRequest) {
  return handleCron(request)
}

export async function POST(request: NextRequest) {
  return handleCron(request)
}

async function handleCron(request: NextRequest) {
  try {
    // 1. Authorize the request (Vercel Cron security check)
    const authHeader = request.headers.get('Authorization')
    const vercelCronHeader = request.headers.get('x-vercel-cron')
    const cronSecret = process.env.CRON_SECRET

    const isAuthorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      vercelCronHeader === 'true' ||
      process.env.NODE_ENV === 'development' // Bypassed in dev for easier local testing

    if (!isAuthorized) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized request. CRON_SECRET mismatch.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Validate essential configurations
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not defined in environment variables.')
      return NextResponse.json(
        { error: 'Resend API Key is missing. Email reminders aborted.' },
        { status: 500 }
      )
    }

    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'
    const resend = new Resend(resendApiKey)

    // 3. Initialize Supabase Admin Client
    const supabase = createAdminClient()

    // 4. Fetch customers who are overdue or due today and have outstanding balances
    const today = new Date().toISOString().split('T')[0]
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .gt('outstanding', 0)
      .not('email', 'is', null)
      .lte('due_date', today)

    if (fetchError) {
      console.error('Database error fetching outstanding customers:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch outstanding customers from database.' },
        { status: 500 }
      )
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        message: 'No outstanding customer invoices due or overdue today.',
        processedCount: 0,
      })
    }

    const results = []
    let successCount = 0
    let failureCount = 0

    // 5. Send automated emails via Resend
    for (const customer of customers) {
      try {
        const bodyText = generateMessage(
          (customer.reminder_stage as ReminderStage) || 'none',
          {
            name: customer.name,
            outstanding: Number(customer.outstanding),
          }
        )

        const htmlBody = generateHtmlTemplate(
          (customer.reminder_stage as ReminderStage) || 'none',
          {
            name: customer.name,
            outstanding: Number(customer.outstanding),
            invoiceAmount: Number(customer.invoice_amount),
            receivedAmount: Number(customer.received_amount),
            delayDays: Number(customer.delay_days),
            dueDate: customer.due_date,
            payUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://duepilots.vercel.app',
          }
        )

        const emailSubject = customer.reminder_stage === 'polite_harsh'
          ? `URGENT: Outstanding Balance Reminder - ${customer.name}`
          : `Friendly Reminder: Outstanding Payment Due - ${customer.name}`

        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [customer.email],
          subject: emailSubject,
          text: bodyText,
          html: htmlBody,
        })

        if (error) {
          console.error(`Resend failed for customer ${customer.id}:`, error)
          results.push({
            customerId: customer.id,
            customerName: customer.name,
            email: customer.email,
            status: 'failed',
            error: error.message,
          })
          failureCount++
        } else {
          results.push({
            customerId: customer.id,
            customerName: customer.name,
            email: customer.email,
            status: 'sent',
            messageId: data?.id,
          })
          successCount++
        }
      } catch (itemError: any) {
        console.error(`Error sending email to customer ${customer.name}:`, itemError)
        results.push({
          customerId: customer.id,
          customerName: customer.name,
          email: customer.email,
          status: 'error',
          error: itemError.message || String(itemError),
        })
        failureCount++
      }
    }

    return NextResponse.json({
      message: 'Payment reminder execution completed.',
      summary: {
        totalFound: customers.length,
        sentCount: successCount,
        failedCount: failureCount,
      },
      details: results,
    })
  } catch (error: any) {
    console.error('Unhandled exception in payment reminder cron handler:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message || String(error) },
      { status: 500 }
    )
  }
}
