import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SideNavbar } from "@/components/side-navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Payment Collection",
  description: "Manage customers, balances, and reminders.",
};

import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 transition-colors">
        {user && <Sidebar />}
        <div className="flex-1 overflow-auto min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
