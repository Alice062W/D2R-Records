import { useTranslations } from 'next-intl';

export default function ComingSoonPage({ title }: { title: string }) {
  const t = useTranslations('Nav');

  return (
    <main className="flex flex-col items-center py-10 px-4 gap-4 flex-1 w-full text-center">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{title}</h1>
      <p className="text-sm text-zinc-400 max-w-md">{t('comingSoon')}</p>
    </main>
  );
}
