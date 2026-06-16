import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PITARA — Hidden Cinema',
  description: 'A space where films get the audience they deserve. Real screenings. Real people. Real applause.',
  keywords: ['cinema', 'film screening', 'independent film', 'pitara', 'hidden cinema'],
  authors: [{ name: 'Pitara Team' }],
  themeColor: '#0a0b35',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'PITARA — Hidden Cinema',
    description: 'A space where films get the audience they deserve.',
    type: 'website',
    url: 'https://pitara.cinema',
    siteName: 'Pitara',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="grain" />
        <div className="scanlines" />
        {children}
      </body>
    </html>
  )
}
