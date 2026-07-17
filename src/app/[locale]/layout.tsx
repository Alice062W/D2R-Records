import type { Metadata } from 'next';
import { Geist, Geist_Mono, Cinzel } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Footer from '@/components/Footer';
import SiteNavDrawer from '@/components/nav/SiteNavDrawer';
import '../globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const cinzel = Cinzel({ variable: '--font-cinzel', weight: ['500', '700'], subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'D2R Institute',
  description: 'Diablo II: Resurrected socketed item appraiser — keep or dump in seconds.',
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'zh-TW' | 'zh-CN')) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`dark ${geistSans.variable} ${geistMono.variable} ${cinzel.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-ink-950 text-parchment antialiased">
        <NextIntlClientProvider messages={messages}>
          <SiteNavDrawer />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
