import './globals.css'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { UserProvider } from '@/contexts/UserContext';
import Script from 'next/script'

// Otimizando carregamento de fontes - preload only latin subset
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Isso melhora a velocidade de carregamento visível
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mag Green',
  description: 'Dashboard para gerenciamento de conteúdo',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <Script id="title-script" strategy="beforeInteractive">
          {`
            document.title = 'Mag Green';
          `}
        </Script>
        <Script id="favicon-script" strategy="beforeInteractive">
          {`
            // Forçar atualização do favicon
            const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = '/favicon.ico?' + new Date().getTime();
            document.getElementsByTagName('head')[0].appendChild(link);
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
