'use client';

import { useTranslations } from 'next-intl';
import { useGrailAuth, signInWithGoogle, signOut } from '@/lib/grail/useGrailAuth';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Grail');
  const { userId, loading } = useGrailAuth();

  if (loading) {
    return <p className="text-sm text-muted text-center py-10">{t('loading')}</p>;
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-muted">{t('signInPrompt')}</p>
        <button
          onClick={() => signInWithGoogle()}
          className="px-4 py-2 rounded-lg bg-gold text-ink-950 font-semibold text-sm hover:bg-gold-bright transition-colors"
        >
          {t('signInGoogle')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => signOut()}
          className="text-xs text-muted hover:text-parchment transition-colors"
        >
          {t('signOut')}
        </button>
      </div>
      {children}
    </div>
  );
}
