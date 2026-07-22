'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useGrailAuth, signInWithGoogle } from '@/lib/grail/useGrailAuth';
import { useProfile } from '@/lib/grail/useProfile';
import ProfileAvatar from './ProfileAvatar';

// Replaces the old "Grail Tracker" link in the top-right corner: a Login
// button when signed out, or the user's avatar (linking to /profile) when
// signed in. The Grail Tracker page itself is still reachable from the
// hamburger nav drawer's Tools group.
export default function AccountButton() {
  const t = useTranslations('Grail');
  const locale = useLocale();
  const { userId, user, loading } = useGrailAuth();
  const { profile } = useProfile();

  if (loading) {
    return <div aria-hidden className="w-8 h-8" />;
  }

  if (!userId) {
    return (
      <button
        onClick={() => signInWithGoogle()}
        className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-panel-border text-muted text-xs sm:text-sm hover:border-gold hover:text-gold-bright transition-colors whitespace-nowrap"
      >
        {t('login')}
      </button>
    );
  }

  return (
    <Link href={`/${locale}/profile`} aria-label={t('profileTitle')} className="shrink-0">
      <ProfileAvatar
        photoUrl={user?.user_metadata?.avatar_url as string | undefined}
        avatarChoice={profile?.avatarChoice}
        name={user?.user_metadata?.full_name as string | undefined}
        email={user?.email}
        size="sm"
      />
    </Link>
  );
}
