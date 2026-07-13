'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

const LOCALES = [
  { code: 'en',    label: 'EN' },
  { code: 'zh-TW', label: '繁中' },
  { code: 'zh-CN', label: '简中' },
];

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    // Replace the locale segment at the start of the path
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/'));
  }

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map(l => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            locale === l.code
              ? 'bg-amber-500 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
