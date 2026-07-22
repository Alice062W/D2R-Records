const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-20 h-20 text-3xl',
} as const;

function initialsFor(name?: string | null, email?: string | null): string {
  const source = (name ?? '').trim() || (email ?? '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Renders (in priority order): an explicitly-chosen emoji avatar, the
// user's Google profile photo, or a fallback circle of initials derived
// from their name/email. Shared between AccountButton (nav) and the
// profile page so both stay visually consistent.
export default function ProfileAvatar({
  photoUrl,
  avatarChoice,
  name,
  email,
  size = 'md',
}: {
  photoUrl?: string | null;
  avatarChoice?: string | null;
  name?: string | null;
  email?: string | null;
  size?: keyof typeof SIZE_CLASSES;
}) {
  const dims = SIZE_CLASSES[size];

  if (avatarChoice) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-panel-alt border border-panel-border shrink-0 ${dims}`}
      >
        {avatarChoice}
      </span>
    );
  }

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        referrerPolicy="no-referrer"
        className={`rounded-full object-cover shrink-0 ${dims}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gold text-ink-950 font-bold shrink-0 ${dims}`}
    >
      {initialsFor(name, email)}
    </span>
  );
}
