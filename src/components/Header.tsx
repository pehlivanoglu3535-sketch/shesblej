'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { LANGUAGES, t, type LangCode } from '@/lib/i18n';
import { setLanguageAction } from '@/app/actions/language';
import { logoutAction } from '@/app/(auth)/actions';

export default function Header({
  lang,
  userName,
  isAdmin,
}: {
  lang: LangCode;
  userName: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');

  function onLangChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as LangCode;
    startTransition(async () => {
      await setLanguageAction(next);
      router.refresh();
    });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : '/');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-glass-border bg-[rgba(10,10,8,0.75)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
        <Link href="/" className="flex items-center gap-1.5 text-3xl font-extrabold tracking-tight">
          <Image src="/logo.png" alt="" width={56} height={56} priority className="-mr-0.5" />
          <span className="bg-gradient-to-br from-primary to-primary-2 bg-clip-text text-transparent">
            ShesBlej
          </span>
        </Link>

        <form onSubmit={onSearchSubmit} className="order-last flex w-full min-w-0 overflow-hidden rounded-lg border border-glass-border bg-white/6 focus-within:border-primary sm:order-none sm:w-auto sm:min-w-[180px] sm:flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search_placeholder', lang)}
            className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-[#928d80] focus:outline-none"
          />
          <button
            type="submit"
            className="bg-gradient-to-br from-primary to-primary-2 px-4 text-sm font-extrabold text-ink"
          >
            {t('search_button', lang)}
          </button>
        </form>

        <select
          value={lang}
          onChange={onLangChange}
          disabled={pending}
          className="rounded-lg border border-glass-border bg-white/6 px-2.5 py-2 text-sm text-white"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="text-black">
              {l.flag} {l.name}
            </option>
          ))}
        </select>

        <nav className="hidden items-center gap-3 text-sm font-semibold text-[#cbc6ba] lg:flex">
          <Link href="/gallery" className="hover:text-white">{t('nav_gallery', lang)}</Link>
          <Link href="/blog" className="hover:text-white">{t('nav_blog', lang)}</Link>
          {userName && (
            <>
              <Link href="/my-listings" className="hover:text-white">{t('nav_my_listings', lang)}</Link>
              <Link href="/favorites" className="hover:text-white">{t('nav_my_favorites', lang)}</Link>
              <Link href="/messages" className="hover:text-white">{t('nav_my_messages', lang)}</Link>
              {isAdmin && (
                <Link href="/admin" className="hover:text-white">{t('admin_panel_link', lang)}</Link>
              )}
            </>
          )}
        </nav>

        {userName ? (
          <>
            <span className="hidden text-sm text-muted sm:inline">{userName}</span>
            <form action={logoutAction}>
              <button className="rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold text-white hover:bg-white/12">
                {t('logout_button', lang)}
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold text-white hover:bg-white/12"
          >
            {t('login_button', lang)}
          </Link>
        )}

        <Link
          href="/post-ad"
          className="rounded-lg bg-gradient-to-br from-primary to-primary-2 px-4 py-2 text-sm font-extrabold text-ink shadow-[0_4px_14px_rgba(255,180,0,0.25)]"
        >
          {t('post_ad_button', lang)}
        </Link>
      </div>
    </header>
  );
}
