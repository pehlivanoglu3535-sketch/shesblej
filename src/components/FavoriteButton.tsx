'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleFavoriteAction } from '@/app/actions/favorites';

export default function FavoriteButton({
  listingId,
  initialFavorited,
  isLoggedIn,
  label,
}: {
  listingId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  label: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setFavorited((f) => !f);
    startTransition(async () => {
      const result = await toggleFavoriteAction(listingId);
      if ('favorited' in result) setFavorited(result.favorited);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`rounded-lg border px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${
        favorited
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-glass-border bg-white/6 text-white hover:bg-white/12'
      }`}
    >
      {favorited ? '★' : '☆'} {label}
    </button>
  );
}
