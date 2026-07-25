import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { NAV_GROUPS } from '@/lib/navGroups';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');
  const tNav = await getTranslations('Nav');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-10 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-parchment-bright">
          {t('title')}
        </h1>
        <p className="mt-1 text-gold font-semibold">{t('subtitle')}</p>
        <p className="mt-2 text-sm text-muted max-w-md">{t('description')}</p>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-8">
        {NAV_GROUPS.map(group => (
          <section key={group.key} className="flex flex-col gap-3">
            <h2 className="text-lg font-cinzel text-parchment-bright">{tNav(group.key as never)}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {group.links.map(link => (
                <Link
                  key={link.key}
                  href={`/${locale}/${link.path}`}
                  className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border text-sm font-semibold font-cinzel hover:border-gold hover:text-gold-bright transition-colors bg-panel border-panel-border ${link.colorClass ?? 'text-parchment-bright'}`}
                >
                  <span className="text-2xl" aria-hidden="true">{link.icon}</span>
                  {tNav(link.key as never)}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
