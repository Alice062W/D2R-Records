import { routing } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';
import GrailChecklist from '@/components/grail/GrailChecklist';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function GrailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-8 flex-1 w-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Grail Tracker</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">
          Track which unique and set items you&apos;ve found, and your best roll of each.
        </p>
      </div>
      <div className="w-full max-w-4xl">
        <GrailChecklist />
      </div>
    </main>
  );
}
