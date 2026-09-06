import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/store/CartContext';
import { ThemeProvider } from '@/store/ThemeContext';
import { AuthProvider } from '@/store/AuthContext';
import { AnnouncementBar, Header, Footer, MobileAppCapsule } from '@/components/layout';
import { CartDrawer, FloatingCartBar } from '@/components/cart';

export const viewport: Viewport = {
  themeColor: '#0d3821',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Interesting — Gourmet Quick Pantry',
    template: '%s | Interesting',
  },
  description:
    '15–30 Mins Express Delivery. Direct Orchard Harvest | 100% Zero Adulteration King Grade Cashews & Gourmet Dry Fruits.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Interesting',
  },
  keywords: ['cashews', 'dry fruits', 'gourmet pantry', 'express delivery', 'GI certified'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Interesting Gourmet Quick Pantry',
  },
};

import { ToastProvider } from '@/store/ToastContext';
import { WishlistProvider } from '@/store/WishlistContext';
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <ToastProvider>
                  <WishlistProvider>
                    <div className="header-region">
                      <AnnouncementBar />
                      <Header />
                    </div>
                    <main>{children}</main>
                    <Footer />
                    <CartDrawer />
                    <FloatingCartBar />
                    <MobileAppCapsule />
                  </WishlistProvider>
                </ToastProvider>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
