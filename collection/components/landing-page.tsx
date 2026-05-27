'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  MessageCircle, 
  Check, 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Activity,
  FileText
} from 'lucide-react'

// Tone templates to showcase in the live card previewer
const templates = {
  friendly: {
    label: 'Friendly Tone',
    badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-950/20 border-emerald-900/30',
    accentBorder: 'border-emerald-500/30',
    accentGlow: 'from-emerald-500/20 to-teal-500/20',
    title: 'Friendly Payment Reminder',
    message: (name: string, amt: string) => `Hi ${name},\n\nJust a quick friendly reminder that your account has an outstanding balance of ${amt}. Please let us know if you have any questions.\n\nThank you!`
  },
  professional: {
    label: 'Professional Tone',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    accentText: 'text-white',
    accentBg: 'bg-zinc-950/50 border-zinc-800/80',
    accentBorder: 'border-zinc-700/50',
    accentGlow: 'from-blue-600/30 to-purple-600/30',
    title: 'Official Professional Reminder',
    message: (name: string, amt: string) => `Dear ${name},\n\nWe hope this message finds you well. We are writing to remind you that your account currently shows an outstanding balance of ${amt}. We would appreciate it if you could arrange payment promptly.\n\nSincerely,\nFinance Team`
  },
  urgent: {
    label: 'Urgent Tone',
    badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
    accentText: 'text-rose-400',
    accentBg: 'bg-rose-950/20 border-rose-900/40',
    accentBorder: 'border-rose-500/30',
    accentGlow: 'from-rose-500/20 to-red-500/20',
    title: 'Urgent Overdue Warning',
    message: (name: string, amt: string) => `Dear ${name},\n\nDespite our previous reminders, your account balance of ${amt} remains unpaid. Please remit payment immediately to avoid further action on your account.\n\nRegards,\nCollections Department`
  }
}

export function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  
  // State for the interactive overdue card playground
  const [previewName, setPreviewName] = useState('Jane Cooper')
  const [previewAmount, setPreviewAmount] = useState('14,850.00')
  const [previewTone, setPreviewTone] = useState<'friendly' | 'professional' | 'urgent'>('urgent')

  const faqItems = [
    {
      q: 'How does the WhatsApp reminder integration work?',
      a: 'Our systems compile your customer details and selected follow-up message into a visually striking overdue notification card. We export this as a high-quality PNG and copy it directly to your system clipboard, opening the pre-filled WhatsApp web or mobile link in a new tab. You simply hit paste (Ctrl+V) to attach it! High-impact visual reminders double collection resolution rates.'
    },
    {
      q: 'Is my financial data secure?',
      a: 'Absolutely. We enforce Row Level Security (RLS) policies sandboxed at the database level powered by Supabase. Only you can access your customer ledger and invoice balance logs. Your records remain strictly isolated.'
    },
    {
      q: 'Can I upload customer lists from spreadsheets?',
      a: 'Yes! Our dynamic smart CSV parser handles aliases for headers (such as Client Name, Outstanding, and Terms). If your list lacks due dates but includes invoice dates and net terms (e.g. Net 30), it automatically computes the payment deadlines for you during import.'
    },
    {
      q: 'What are custom Net Terms?',
      a: 'You can assign Net 15, 30, 45, 60, or Custom day terms to any customer. Entering an invoice date automatically sets the payment deadline, and the dashboard tracks overdue/upcoming statuses dynamically in real-time.'
    }
  ]

  const activeTemplate = templates[previewTone]

  return (
    <div className="bg-zinc-950 text-white min-h-screen font-sans antialiased overflow-x-hidden selection:bg-blue-600/30 selection:text-blue-200">
      
      {/* Dynamic Background Glowing Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* 1. Header Navigation */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-50">
        <div className="flex items-center justify-between bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl px-6 py-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20">
              <Activity size={20} className="animate-pulse" />
            </div>
            <span className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              PaymentSaaS
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 relative z-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/35 rounded-full px-4 py-1.5 text-xs font-bold text-blue-400 tracking-wide uppercase">
            <Sparkles size={12} className="animate-spin" />
            <span>Smart Automation is Here</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-200 to-zinc-500">
            Automate Receivables.<br/>
            Recover Cashflow Faster.
          </h1>

          <p className="text-zinc-400 text-base sm:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Stop manually hunting pending payments. Streamline collections with custom due dates, Net terms automation, and gorgeous dynamic overdue notices dispatched via WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/15 hover:shadow-blue-500/25 transition-all text-base tracking-wide flex items-center justify-center space-x-2 group hover:scale-[1.01]"
            >
              <span>Automate Your Collections</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-200 hover:text-white font-bold rounded-2xl transition-all text-base flex items-center justify-center space-x-2"
            >
              <span>Try Live Card Sandbox</span>
            </a>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-semibold text-zinc-500">
            <span className="flex items-center"><Check size={14} className="mr-1.5 text-emerald-500" /> Free 14-day trial</span>
            <span className="flex items-center"><Check size={14} className="mr-1.5 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center"><Check size={14} className="mr-1.5 text-emerald-500" /> Setup in 2 minutes</span>
          </div>
        </div>

        {/* Glassmorphic Dashboard Mockup illustration */}
        <div className="mt-20 max-w-5xl mx-auto rounded-3xl border border-zinc-800/80 bg-zinc-900/30 p-4 shadow-2xl relative overflow-hidden backdrop-blur-md group">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[80px]" />
          <div className="rounded-2xl border border-zinc-800/40 bg-zinc-950/60 overflow-hidden relative shadow-2xl">
            {/* Header placeholder */}
            <div className="h-12 border-b border-zinc-900 bg-zinc-950/90 px-4 flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <div className="flex-1 text-center text-[10px] font-mono text-zinc-600">collections-center-workspace</div>
            </div>
            
            {/* Dashboard Mock Render */}
            <div className="p-6 grid grid-cols-3 gap-6 text-left opacity-90 group-hover:opacity-100 transition-opacity">
              <div className="col-span-2 space-y-4">
                <div className="h-6 w-36 bg-zinc-800 rounded-lg" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-20 bg-zinc-900 border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <div className="h-2 w-16 bg-zinc-800 rounded" />
                    <div className="h-4 w-12 bg-zinc-700 rounded" />
                  </div>
                  <div className="h-20 bg-zinc-900 border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <div className="h-2 w-16 bg-zinc-800 rounded" />
                    <div className="h-4 w-12 bg-zinc-700 rounded" />
                  </div>
                  <div className="h-20 bg-zinc-900 border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <div className="h-2 w-16 bg-zinc-800 rounded" />
                    <div className="h-4 w-12 bg-zinc-700 rounded" />
                  </div>
                </div>
                <div className="h-40 bg-zinc-900 border border-zinc-800/60 rounded-2xl" />
              </div>
              <div className="col-span-1 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between">
                <div className="h-3 w-24 bg-zinc-800 rounded" />
                <div className="space-y-3 flex-1 py-4 justify-center flex flex-col">
                  <div className="h-2 w-full bg-zinc-800 rounded" />
                  <div className="h-2 w-3/4 bg-zinc-800 rounded" />
                  <div className="h-2 w-5/6 bg-zinc-800 rounded" />
                </div>
                <div className="h-8 bg-blue-600 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Visual Statistics Banner */}
      <section className="bg-zinc-900/40 border-y border-zinc-800 py-12 relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <h3 className="text-4xl sm:text-5xl font-black text-blue-500 tracking-tight">98.5%</h3>
            <p className="text-zinc-400 text-sm font-semibold tracking-wider uppercase">Receivables Recovery Rate</p>
            <p className="text-zinc-600 text-xs mt-0.5">Average collection speed optimization</p>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 sm:border-x border-zinc-800/60 pt-6 sm:pt-0">
            <h3 className="text-4xl sm:text-5xl font-black text-purple-500 tracking-tight">2.4x</h3>
            <p className="text-zinc-400 text-sm font-semibold tracking-wider uppercase">Faster Invoice Settlement</p>
            <p className="text-zinc-600 text-xs mt-0.5">Decreased aging delay days</p>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 pt-6 sm:pt-0">
            <h3 className="text-4xl sm:text-5xl font-black text-emerald-500 tracking-tight">10k+</h3>
            <p className="text-zinc-400 text-sm font-semibold tracking-wider uppercase">Pending Bills Resolved</p>
            <p className="text-zinc-600 text-xs mt-0.5">Automated visual follow-ups</p>
          </div>
        </div>
      </section>

      {/* 4. Live Overdue Card Previewer Sandbox */}
      <section id="demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-30">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
            Interactive Overdue Sandbox
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-3 leading-relaxed">
            Test the live card generator. Fill out the mock client information, choose your follow-up tone style, and see the reminder dynamically shift its aesthetics in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Controls Panel */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-md shadow-xl space-y-6">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles size={16} className="text-blue-500 animate-pulse" />
              <h3 className="text-lg font-bold text-white">Preview Controls</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Customer Name</label>
              <input 
                type="text" 
                value={previewName} 
                onChange={(e) => setPreviewName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Jane Cooper"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Outstanding Balance ($)</label>
              <input 
                type="text" 
                value={previewAmount} 
                onChange={(e) => setPreviewAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Select Tone Style</label>
              <div className="grid grid-cols-3 gap-3 p-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl">
                {(['friendly', 'professional', 'urgent'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPreviewTone(t)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold capitalize tracking-wider transition-all ${
                      previewTone === t
                        ? 'bg-zinc-900 text-white shadow-sm border border-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 text-xs text-zinc-500 leading-relaxed flex gap-2">
              <span className="text-blue-400 shrink-0 font-bold">💡 Pro-Tip:</span>
              <span>Our system automatically renders this custom card, converts it to an image, and copies it to your clipboard when sending a WhatsApp reminder, allowing you to hit paste (Ctrl+V) directly into the chat!</span>
            </div>
          </div>

          {/* Live Preview Render Box */}
          <div className="flex justify-center">
            <div 
              className="w-full max-w-[440px] h-[550px] bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden rounded-3xl border border-zinc-850 shadow-2xl"
              style={{ fontFamily: 'sans-serif' }}
            >
              {/* Dynamic Glow Accents */}
              <div className={`absolute top-[-10%] left-[-10%] w-[320px] h-[320px] rounded-full blur-[80px] bg-gradient-to-br ${activeTemplate.accentGlow} transition-all duration-700`} />
              <div className={`absolute bottom-[-10%] right-[-10%] w-[320px] h-[320px] rounded-full blur-[80px] bg-gradient-to-br ${activeTemplate.accentGlow} transition-all duration-700`} />
              
              {/* Subtle Grid overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              {/* Glassmorphic Card */}
              <div className={`w-[360px] bg-zinc-900/60 backdrop-blur-2xl border ${activeTemplate.accentBorder} rounded-2xl p-6 shadow-2xl relative z-10 flex flex-col transition-colors duration-500`}>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b border-zinc-800 pb-4">
                  <div>
                    <h4 className="text-base font-black tracking-tight text-white mb-0.5">Payment App</h4>
                    <p className={`font-semibold tracking-wide text-[9px] uppercase transition-colors ${activeTemplate.accentText}`}>
                      {activeTemplate.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-[9px] mb-1">Today</p>
                    <div className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border transition-colors ${activeTemplate.badgeClass}`}>
                      {previewTone}
                    </div>
                  </div>
                </div>

                {/* Billed To */}
                <div className="mb-6">
                  <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-1">Billed To</p>
                  <h3 className="text-xl font-extrabold text-white tracking-tight truncate">{previewName || 'Client Name'}</h3>
                </div>

                {/* Amount */}
                <div className={`mb-6 rounded-xl p-4 border ${activeTemplate.accentBg} text-center shadow-inner transition-colors duration-500`}>
                  <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-wider mb-1">Outstanding Balance</p>
                  <p className={`text-3xl font-black ${activeTemplate.accentText} tracking-tighter transition-colors`}>
                    ${previewAmount || '0.00'}
                  </p>
                </div>

                {/* Message Body */}
                <div className="bg-zinc-850/40 rounded-xl p-4 border border-zinc-800/50 flex-1 min-h-[100px] max-h-[140px] overflow-y-auto">
                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-xs font-semibold">
                    {activeTemplate.message(previewName, `$${previewAmount}`)}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center border-t border-zinc-850 pt-4">
                  <p className="text-zinc-500 text-[9px] font-medium tracking-wide">
                    {previewTone === 'urgent' ? 'Please settle this invoice immediately to ensure service.' : 'Thank you for your prompt attention.'}
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid Section */}
      <section id="features" className="bg-zinc-900/20 border-y border-zinc-900 py-24 relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Built to Solve Collections Delay
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-4 leading-relaxed">
              Stop relying on static spreadsheets or sticky notes. Automate payment timelines and ensure every outstanding invoice receives a high-impact notification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 space-y-4 hover:border-zinc-700/60 transition-colors">
              <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl w-12 border border-blue-500/20">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Customer History Directory</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Store phone numbers, primary contacts, and tracking statistics. Maintain a complete ledger trace of invoice history for each customer.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 space-y-4 hover:border-zinc-700/60 transition-colors">
              <div className="p-3 bg-purple-600/10 text-purple-500 rounded-xl w-12 border border-purple-500/20">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Dynamic Net Payment Terms</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Assign Net 15, 30, 45, or Custom terms. Enter an invoice date and watch the system automatically compute exact deadlines and overdue metrics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 space-y-4 hover:border-zinc-700/60 transition-colors">
              <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-xl w-12 border border-emerald-500/20">
                <MessageCircle size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Visual Overdue Dispatches</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Generate high-resolution glowing reminder cards with embedded bill balances, copied instantly to your system clipboard for one-click WhatsApp pasting.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-30">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-4">
            Start completely free. No credit card required. Upgrade as your debtor list grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Tier */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 flex flex-col justify-between space-y-8 relative overflow-hidden group">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Starter Free</h3>
                <p className="text-zinc-400 text-xs mt-1">Perfect for solo freelancers or tuition centers</p>
              </div>
              
              <div className="flex items-baseline text-white">
                <span className="text-5xl font-black tracking-tight">$0</span>
                <span className="ml-1.5 text-zinc-500 text-sm font-semibold">/ forever</span>
              </div>

              <ul className="space-y-3.5 text-sm font-semibold text-zinc-300">
                <li className="flex items-center"><Check size={16} className="text-emerald-500 mr-2.5 shrink-0" /> Up to 10 customers</li>
                <li className="flex items-center"><Check size={16} className="text-emerald-500 mr-2.5 shrink-0" /> Record credits & debit invoices</li>
                <li className="flex items-center"><Check size={16} className="text-emerald-500 mr-2.5 shrink-0" /> Timezone-safe DatePicker</li>
                <li className="flex items-center"><Check size={16} className="text-emerald-500 mr-2.5 shrink-0" /> Clipboard image reminder cards</li>
              </ul>
            </div>

            <Link 
              href="/signup"
              className="block w-full py-3.5 text-center bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white font-extrabold rounded-2xl transition-colors border border-zinc-800 hover:border-zinc-700 text-sm tracking-wide"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-zinc-900/60 border-2 border-blue-600 rounded-3xl p-8 flex flex-col justify-between space-y-8 relative overflow-hidden shadow-xl shadow-blue-500/5 group">
            <div className="absolute top-0 right-0 bg-blue-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
              Most Popular
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Professional <Sparkles size={14} className="text-blue-400 animate-pulse" />
                </h3>
                <p className="text-zinc-400 text-xs mt-1">Perfect for growing wholsalers & clinicians</p>
              </div>
              
              <div className="flex items-baseline text-white">
                <span className="text-5xl font-black tracking-tight">$19</span>
                <span className="ml-1.5 text-zinc-500 text-sm font-semibold">/ month</span>
              </div>

              <ul className="space-y-3.5 text-sm font-semibold text-zinc-300">
                <li className="flex items-center"><Check size={16} className="text-blue-500 mr-2.5 shrink-0" /> Unlimited customer directories</li>
                <li className="flex items-center"><Check size={16} className="text-blue-500 mr-2.5 shrink-0" /> AI-powered credit analytics & insights</li>
                <li className="flex items-center"><Check size={16} className="text-blue-500 mr-2.5 shrink-0" /> Unlimited spreadsheet CSV imports</li>
                <li className="flex items-center"><Check size={16} className="text-blue-500 mr-2.5 shrink-0" /> Custom branding on Overdue PNGs</li>
                <li className="flex items-center"><Check size={16} className="text-blue-500 mr-2.5 shrink-0" /> Priority WhatsApp API hooks</li>
              </ul>
            </div>

            <Link 
              href="/signup"
              className="block w-full py-3.5 text-center bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all text-sm tracking-wide hover:scale-[1.01]"
            >
              Start Free Trial
            </Link>
          </div>

        </div>
      </section>

      {/* 7. FAQs Accordion Section */}
      <section id="faqs" className="bg-zinc-900/20 border-y border-zinc-900 py-24 relative z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Frequently Asked Questions</h2>
            <p className="text-zinc-400 text-sm mt-3">Everything you need to know about setting up and automating collections.</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => {
              const isOpen = activeFaq === idx
              
              return (
                <div 
                  key={idx}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left font-bold text-sm sm:text-base text-zinc-100 hover:text-white"
                  >
                    <span>{item.q}</span>
                    <ChevronDown 
                      size={18} 
                      className={`text-zinc-500 transition-transform duration-250 ${isOpen ? 'rotate-180 text-white' : ''}`} 
                    />
                  </button>
                  
                  {isOpen && (
                    <div className="px-6 pb-6 text-xs sm:text-sm text-zinc-400 leading-relaxed font-semibold border-t border-zinc-850 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* 8. Call to Action (Bottom Banner) */}
      <section className="relative z-30 py-24 text-center max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-3xl p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#3b82f60a,transparent_60%)] pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Ready to secure your cashflow?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
            Create your account today and experience lightning-fast payments resolution. Set up in less than 2 minutes.
          </p>
          <Link 
            href="/signup"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.01] transition-all text-sm sm:text-base tracking-wide"
          >
            <span>Get Started For Free</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 relative z-30 text-zinc-500 text-xs sm:text-sm font-semibold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-zinc-900 rounded-lg text-blue-500 border border-zinc-800">
              <Activity size={14} />
            </div>
            <span className="font-extrabold text-zinc-300">PaymentSaaS</span>
          </div>
          <div>
            <p className="text-zinc-600 text-xs">&copy; 2026 PaymentSaaS Inc. All rights reserved. Made timezone-safely worldwide.</p>
          </div>
          <div className="flex space-x-6 text-zinc-500 text-xs">
            <a href="#features" className="hover:text-zinc-300 transition-colors">Features</a>
            <a href="#demo" className="hover:text-zinc-300 transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-zinc-300 transition-colors">Pricing</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
