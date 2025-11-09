import { Lilita_One, Podkova } from 'next/font/google'
import './globals.css'
import { TranslationProvider } from '@/components/TranslationProvider'
import AppShell from '@/components/AppShell'

const podkova = Podkova({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-podkova'
})

const lilitaOne = Lilita_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-lilita'
})

export const metadata = {
  title: 'Pet Grooming Manager',
  description: 'Manage your pet grooming appointments',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${podkova.variable} ${lilitaOne.variable}`}>
        <TranslationProvider>
          <AppShell>{children}</AppShell>
        </TranslationProvider>
      </body>
    </html>
  )
}
