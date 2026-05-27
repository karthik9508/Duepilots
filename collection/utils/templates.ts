export type ReminderStage = 'none' | 'cold' | 'business_formal' | 'formal_polite' | 'polite_harsh';

interface TemplateParams {
  name: string;
  outstanding: number;
  outstandingLabel?: string;
}

export function generateMessage(stage: ReminderStage, { name, outstanding, outstandingLabel }: TemplateParams): string {
  const amount = outstandingLabel ?? `$${outstanding.toFixed(2)}`;
  
  switch (stage) {
    case 'cold':
      return `Hi ${name},\n\nJust a quick friendly reminder that your account has an outstanding balance of ${amount}. Please let us know if you have any questions.\n\nThank you!`;
      
    case 'business_formal':
      return `Dear ${name},\n\nThis is a formal reminder regarding your outstanding balance of ${amount}. We kindly request you to process the payment at your earliest convenience.\n\nBest regards,`;
      
    case 'formal_polite':
      return `Dear ${name},\n\nWe hope this message finds you well. We are writing to remind you that your account currently shows an overdue balance of ${amount}. We would appreciate it if you could arrange payment promptly to keep your account in good standing.\n\nSincerely,`;
      
    case 'polite_harsh':
      return `Dear ${name},\n\nDespite our previous reminders, your account balance of ${amount} remains unpaid. Please remit payment immediately to avoid further action on your account. If you have already paid, please ignore this message.\n\nRegards,`;
      
    case 'none':
    default:
      return `Hi ${name},\n\nYour current outstanding balance is ${amount}.`;
  }
}
