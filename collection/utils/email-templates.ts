import { ReminderStage } from './templates';

interface HtmlTemplateParams {
  name: string;
  outstanding: number;
  invoiceAmount?: number;
  receivedAmount?: number;
  delayDays?: number;
  dueDate?: string | null;
  businessName?: string;
  payUrl?: string;
  supportEmail?: string;
}

export function generateHtmlTemplate(
  stage: ReminderStage,
  {
    name,
    outstanding,
    invoiceAmount,
    receivedAmount,
    delayDays,
    dueDate,
    businessName = 'Duepilots Reminders',
    payUrl,
    supportEmail,
  }: HtmlTemplateParams
): string {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);

  const outstandingFormatted = formatCurrency(outstanding);
  const invoiceFormatted = invoiceAmount ? formatCurrency(invoiceAmount) : null;
  const receivedFormatted = receivedAmount !== undefined ? formatCurrency(receivedAmount) : null;

  // 1. Theme Configuration based on reminder stage
  let accentColor = '#6366f1'; // Violet/Indigo (Default)
  let badgeText = 'Account Statement';
  let bannerTitle = 'Outstanding Balance Notice';
  let bannerDesc = 'Please review your invoice statement details below.';
  
  // Custom message body styling and templates
  let messageBody = '';

  switch (stage) {
    case 'cold':
      accentColor = '#10b981'; // Emerald
      badgeText = 'Friendly Reminder';
      bannerTitle = 'Friendly Account Notice';
      bannerDesc = 'Just a friendly check-in regarding your active balance.';
      messageBody = `We hope you are having a wonderful week! This is a quick friendly reminder that your account with us has an active balance of <strong>${outstandingFormatted}</strong>. We would appreciate it if you could take a moment to review the details below.`;
      break;

    case 'business_formal':
      accentColor = '#475569'; // Slate Blue
      badgeText = 'Formal Notice';
      bannerTitle = 'Outstanding Balance Notice';
      bannerDesc = 'An outstanding invoice balance requires your review.';
      messageBody = `Please find below the account summary regarding your outstanding invoice of <strong>${outstandingFormatted}</strong>. We kindly request that you process the payment at your earliest convenience to maintain continuous service.`;
      break;

    case 'formal_polite':
      accentColor = '#f59e0b'; // Amber Gold
      badgeText = 'Action Required';
      bannerTitle = 'Overdue Invoice Reminder';
      bannerDesc = 'Your invoice payment is currently overdue. Please process today.';
      messageBody = `We hope this message finds you well. We are writing to remind you that your account currently shows an overdue balance of <strong>${outstandingFormatted}</strong>. We value your business highly and kindly ask that you arrange payment promptly to keep your account in good standing.`;
      break;

    case 'polite_harsh':
      accentColor = '#ef4444'; // Red
      badgeText = 'IMMEDIATE ACTION REQUIRED';
      bannerTitle = 'Urgent: Past Due Account';
      bannerDesc = 'Your account is critically past due. Immediate action is required.';
      messageBody = `Despite our previous communications, your outstanding balance of <strong>${outstandingFormatted}</strong> remains past due. Please remit the outstanding amount immediately to avoid disruption or further administrative action. If payment has already been sent, please email our support team with your receipt.`;
      break;

    case 'none':
    default:
      accentColor = '#6366f1'; // Indigo
      badgeText = 'Account Update';
      bannerTitle = 'Outstanding Statement';
      bannerDesc = 'Your current payment statement summary is available.';
      messageBody = `This is an automated balance notification. Your account currently shows an outstanding balance of <strong>${outstandingFormatted}</strong>. Please see the complete breakdown below.`;
      break;
  }

  const actionUrl = payUrl || 'https://duepilots.vercel.app';
  const supportMailAddress = supportEmail || process.env.EMAIL_FROM || 'support@duepilots.com';

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>${bannerTitle}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    
    /* Hover effects for premium feeling */
    .cta-btn:hover { background-color: #312e81 !important; border-color: #312e81 !important; transform: translateY(-1px); }
    .card-container { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.03), 0 4px 6px -2px rgba(0,0,0,0.02) !important; }
  </style>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #f4f6f8;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="background-color: #f4f6f8; padding: 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          
          <!-- Logo / Brand Header -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Decorative Modern Gradient Checkmark Emblem -->
                  <td style="background-color: ${accentColor}10; padding: 10px; border-radius: 12px; display: inline-block; vertical-align: middle; margin-right: 10px;">
                    <span style="color: ${accentColor}; font-size: 20px; font-weight: 800; line-height: 1; display: block;">⚡</span>
                  </td>
                  <td style="vertical-align: middle;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em;">
                      ${businessName}
                    </h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Premium Card Container -->
          <tr class="card-container">
            <td style="background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- Accent Color Highlight Top Bar -->
                <tr>
                  <td height="8" style="background-color: ${accentColor};"></td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 44px 36px 36px 36px;">
                    
                    <!-- Overdue Warning Badge (If delay_days exists and > 0) -->
                    <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="background-color: ${accentColor}12; color: ${accentColor}; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 5px 12px; border-radius: 9999px; display: inline-block;">
                          ${badgeText} ${delayDays && delayDays > 0 ? `• ${delayDays} Days Overdue` : ''}
                        </td>
                      </tr>
                    </table>

                    <!-- Principal Heading -->
                    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.25; letter-spacing: -0.03em;">
                      ${bannerTitle}
                    </h1>
                    <p style="margin: 0 0 32px 0; font-size: 14px; color: #64748b; line-height: 1.4;">
                      ${bannerDesc}
                    </p>

                    <!-- Salutation -->
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155; font-weight: 500;">
                      Dear ${name},
                    </p>

                    <!-- Core Message Content -->
                    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.65; color: #334155;">
                      ${messageBody}
                    </p>

                    <!-- Modern Multi-Column Invoice Statement Grid -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 36px;">
                      <tr>
                        <td style="padding: 24px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            
                            <!-- Header Grid Title -->
                            <tr>
                              <td colspan="2" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 16px; border-bottom: 1px dashed #cbd5e1;">
                                Statement Summary
                              </td>
                            </tr>

                            <!-- Invoice Total (if available) -->
                            ${
                              invoiceFormatted
                                ? `
                            <tr>
                              <td style="padding: 14px 0 6px 0; font-size: 14px; color: #475569;">Original Invoice Amount</td>
                              <td align="right" style="padding: 14px 0 6px 0; font-size: 14px; font-weight: 600; color: #334155;">${invoiceFormatted}</td>
                            </tr>
                            `
                                : ''
                            }

                            <!-- Received/Paid (if available) -->
                            ${
                              receivedFormatted
                                ? `
                            <tr>
                              <td style="padding: 6px 0 12px 0; font-size: 14px; color: #10b981;">Total Received / Paid</td>
                              <td align="right" style="padding: 6px 0 12px 0; font-size: 14px; font-weight: 600; color: #10b981;">-${receivedFormatted}</td>
                            </tr>
                            `
                                : ''
                            }

                            <!-- Divider line -->
                            ${invoiceFormatted || receivedFormatted ? '<tr><td colspan="2" height="1" style="background-color: #e2e8f0;"></td></tr>' : ''}

                            <!-- Outstanding Balance (Highlight) -->
                            <tr>
                              <td style="padding: 16px 0 6px 0; font-size: 15px; font-weight: 700; color: #0f172a;">Remaining Balance Due</td>
                              <td align="right" style="padding: 16px 0 6px 0; font-size: 26px; font-weight: 800; color: ${accentColor};">${outstandingFormatted}</td>
                            </tr>

                            <!-- Due Date Details -->
                            ${
                              dueDate
                                ? `
                            <tr>
                              <td colspan="2" style="padding-top: 6px; font-size: 13px; color: #64748b;">
                                <strong>Payment Due Date:</strong> ${dueDate}
                              </td>
                            </tr>
                            `
                                : ''
                            }
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Payment Options Section (CTA & Direct Bank Transfer details) -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                      <tr>
                        <td align="center" style="padding-bottom: 24px;">
                          <!-- Pay Button -->
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="border-radius: 8px; background-color: ${accentColor};">
                                <a href="${actionUrl}" target="_blank" class="cta-btn" style="display: inline-block; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; border: 1px solid ${accentColor}; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2); transition: all 0.15s ease-in-out;">
                                  Pay Outstanding Invoice Online
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Alternative Payment Option: Bank Transfer Details (For B2B trust) -->
                      <tr>
                        <td style="background-color: #f8fafc; border-radius: 8px; padding: 16px 20px; border: 1px solid #e2e8f0; text-align: left;">
                          <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em;">
                            🏦 Bank Transfer Details (Optional)
                          </h4>
                          <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                            Prefer wire transfer? Please remit payment to our corporate account:<br />
                            <strong>Bank Name:</strong> Silicon Valley Bank (or your default B2B bank)<br />
                            <strong>Account Number:</strong> •••• •••• 9283 &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Routing:</strong> •••••031
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Professional Verification Footer Badge -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                      <tr>
                        <td style="font-size: 12px; color: #94a3b8; vertical-align: middle;">
                          🔒 <strong>Secure payment infrastructure</strong> verified by ${businessName}
                        </td>
                      </tr>
                    </table>

                    <!-- Sign-off Signature -->
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155;">
                      Thank you for your business,<br />
                      <strong style="color: #0f172a;">${businessName} Finance Operations</strong>
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Legal & Opt-out/Contact -->
          <tr>
            <td align="center" style="padding: 28px 24px 0 24px;">
              <p style="margin: 0 0 8px 0; font-size: 11px; line-height: 1.6; color: #94a3b8; text-align: center;">
                You are receiving this billing notice because of an outstanding account balance associated with your account on ${businessName}. 
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #94a3b8; text-align: center;">
                Need assistance? Reply directly to this email or contact us at <a href="mailto:${supportMailAddress}" style="color: ${accentColor}; text-decoration: none; font-weight: 600;">${supportMailAddress}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
