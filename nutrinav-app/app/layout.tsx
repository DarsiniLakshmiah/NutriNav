import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NutriNav — Healthy Meals at Your Corner Store',
  description: 'AI-powered bilingual meal planning for DC SNAP residents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F5F0E8] min-h-screen`}>
        {children}
        <footer className="text-center text-xs text-gray-400 py-3 px-4">
          NutriNav is an independent tool. Not affiliated with DCCK, USDA, or DC SNAP.
        </footer>
      </body>
    </html>
  )
}
