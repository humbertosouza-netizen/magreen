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
  title: 'Mag Green - Magnificência Green',
  description: 'Plataforma de cultivo indoor de cannabis com ciência, arte e consciência',
  keywords: 'cannabis, cultivo, indoor, sustentabilidade, tecnologia, educação',
  authors: [{ name: 'Mag Green' }],
  creator: 'Mag Green',
  publisher: 'Mag Green',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://magreen.org'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Mag Green - Magnificência Green',
    description: 'Plataforma de cultivo indoor de cannabis com ciência, arte e consciência',
    url: 'https://magreen.org',
    siteName: 'Mag Green',
    images: [
      {
        url: '/images/logo/magnificencia-green-full-logo.png',
        width: 1200,
        height: 630,
        alt: 'Mag Green Logo',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mag Green - Magnificência Green',
    description: 'Plataforma de cultivo indoor de cannabis com ciência, arte e consciência',
    images: ['/images/logo/magnificencia-green-full-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/logo/magnificencia-green-full-logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/logo/magnificencia-green-full-logo.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/images/logo/magnificencia-green-full-logo.png',
  },
  manifest: '/manifest.json',
  themeColor: '#7FDB3F',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
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
        <Script id="pwa-script" strategy="afterInteractive">
          {`
            // Registrar Service Worker para PWA
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registrado com sucesso:', registration.scope);
                  })
                  .catch(function(registrationError) {
                    console.log('Falha no registro do SW:', registrationError);
                  });
              });
            }
            
            // Adicionar meta tags PWA
            const metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            metaThemeColor.content = '#7FDB3F';
            document.head.appendChild(metaThemeColor);
            
            const metaAppleMobileWebApp = document.createElement('meta');
            metaAppleMobileWebApp.name = 'apple-mobile-web-app-capable';
            metaAppleMobileWebApp.content = 'yes';
            document.head.appendChild(metaAppleMobileWebApp);
            
            const metaAppleMobileWebAppStatusBar = document.createElement('meta');
            metaAppleMobileWebAppStatusBar.name = 'apple-mobile-web-app-status-bar-style';
            metaAppleMobileWebAppStatusBar.content = 'black-translucent';
            document.head.appendChild(metaAppleMobileWebAppStatusBar);
            
            const metaAppleMobileWebAppTitle = document.createElement('meta');
            metaAppleMobileWebAppTitle.name = 'apple-mobile-web-app-title';
            metaAppleMobileWebAppTitle.content = 'Mag Green';
            document.head.appendChild(metaAppleMobileWebAppTitle);
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
