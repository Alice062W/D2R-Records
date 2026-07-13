import { useTranslations } from 'next-intl';
import LocaleSwitcher from './LocaleSwitcher';

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="mt-auto border-t border-zinc-800 py-6 px-4">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-3">
          <a
            href="https://ko-fi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-amber-400 hover:text-amber-300 transition-colors"
          >
            ☕ {t('support')}
          </a>
          <span className="hidden sm:inline">{t('tagline')}</span>
        </div>
        <LocaleSwitcher />
      </div>
    </footer>
  );
}
