'use client';

import { useGrailAuth, signInWithGoogle, signOut } from '@/lib/grail/useGrailAuth';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { userId, loading } = useGrailAuth();

  if (loading) {
    return <p className="text-sm text-zinc-500 text-center py-10">Loading…</p>;
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-zinc-400">Sign in to view your grail tracker.</p>
        <button
          onClick={() => signInWithGoogle()}
          className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => signOut()}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
