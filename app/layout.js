import { Inter } from 'next/font/google'
import './globals.css'
import { TranslationProvider } from '@/components/TranslationProvider'
import AppShell from '@/components/AppShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pet Grooming Manager',
  description: 'Manage your pet grooming appointments',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TranslationProvider>
          <AppShell>{children}</AppShell>
        </TranslationProvider>
      </body>
    </html>
  )
}
