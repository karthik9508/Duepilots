import { forwardRef } from 'react'

interface ReminderCardExportProps {
  customerName: string
  outstandingLabel: string
  message: string
  stageLabel: string
}

export const ReminderCardExport = forwardRef<HTMLDivElement, ReminderCardExportProps>(
  ({ customerName, outstandingLabel, message, stageLabel }, ref) => {
    
    // Formatting the date timezone-safely
    const date = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date())

    const isUrgent = stageLabel === 'Urgent'
    const isFriendly = stageLabel === 'Friendly'

    // Premium dynamic CRM color configurations
    const bgGlow1 = isUrgent ? 'bg-rose-600/30' : isFriendly ? 'bg-emerald-600/25' : 'bg-blue-600/30'
    const bgGlow2 = isUrgent ? 'bg-red-500/20' : isFriendly ? 'bg-teal-500/20' : 'bg-purple-600/30'
    const bgGlow3 = isUrgent ? 'bg-rose-500/10' : isFriendly ? 'bg-emerald-500/10' : 'bg-emerald-500/20'
    const cardBorder = isUrgent ? 'border-rose-500/30' : isFriendly ? 'border-emerald-500/30' : 'border-zinc-700/50'
    const amountBg = isUrgent ? 'bg-rose-950/20 border-rose-900/40' : isFriendly ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-zinc-950/50 border-zinc-800/80'
    const amountText = isUrgent ? 'text-rose-400' : isFriendly ? 'text-emerald-400' : 'text-white'
    const badgeStyle = isUrgent ? 'bg-rose-950/50 text-rose-300 border-rose-800/45' : isFriendly ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/45' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
    const officialLabel = isUrgent ? 'Urgent Overdue Warning' : isFriendly ? 'Friendly Payment Reminder' : 'Official Professional Reminder'

    return (
      <div 
        className="fixed top-0 left-[-9999px] opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        <div 
          ref={ref}
          // The actual canvas to be captured (800x1000 is a good portrait size)
          className="w-[800px] h-[1000px] bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden"
          style={{ fontFamily: 'sans-serif' }}
        >
          {/* Decorative Background Elements */}
          <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] ${bgGlow1} rounded-full blur-[100px]`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] ${bgGlow2} rounded-full blur-[100px]`} />
          <div className={`absolute top-[40%] left-[20%] w-[300px] h-[300px] ${bgGlow3} rounded-full blur-[100px]`} />
          
          {/* Subtle overlay grid for premium depth */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Main Card (Glassmorphism) */}
          <div className={`w-[640px] bg-zinc-900/60 backdrop-blur-2xl border ${cardBorder} rounded-3xl p-12 shadow-2xl relative z-10 flex flex-col`}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b border-zinc-800 pb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tighter text-white mb-2">Payment App</h1>
                <p className={`font-semibold tracking-wide text-xs uppercase ${isUrgent ? 'text-rose-400' : isFriendly ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {officialLabel}
                </p>
              </div>
              <div className="text-right">
                <p className="text-zinc-400 text-sm mb-2">{date}</p>
                <div className={`inline-flex px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${badgeStyle}`}>
                  {stageLabel}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-10">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Billed To</p>
              <h2 className="text-4xl font-extrabold text-white tracking-tight">{customerName}</h2>
            </div>

            {/* Amount */}
            <div className={`mb-10 rounded-2xl p-8 border ${amountBg} text-center shadow-inner`}>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Outstanding Balance</p>
              <p className={`text-6xl font-black ${amountText} tracking-tighter`}>{outstandingLabel}</p>
            </div>

            {/* Message Body */}
            <div className="flex-1 bg-zinc-850/40 rounded-2xl p-8 border border-zinc-800/50">
              <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed text-lg font-medium">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-10 text-center border-t border-zinc-800/60 pt-6">
              <p className="text-zinc-500 text-xs font-medium tracking-wide">
                {isUrgent ? 'Please settle this invoice immediately to ensure service continuity.' : 'Thank you for your prompt attention to this matter.'}
              </p>
            </div>
            
          </div>
        </div>
      </div>
    )
  }
)

ReminderCardExport.displayName = 'ReminderCardExport'
