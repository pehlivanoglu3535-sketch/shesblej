'use client';

import { useState } from 'react';
import { t, type LangCode } from '@/lib/i18n';

/**
 * Paylaşım düğmeleri.
 *
 * Adres sunucuda değil tarayıcıda okunuyor: ilan hem shesblejks.com hem
 * vercel önizleme adresinden açılabiliyor ve paylaşılan bağlantının
 * kullanıcının gerçekten açtığı adres olması gerekiyor.
 *
 * Telefonda önce yerel paylaşım sayfası deneniyor; masaüstünde o API yok,
 * orada bağlantı panoya kopyalanıyor.
 */
export default function ShareButtons({ title, lang }: { title: string; lang: LangCode }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Kullanıcı paylaşım sayfasını kapattı; kopyalamaya düşmek yanlış
        // olurdu çünkü vazgeçmiş olabilir.
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold"
    >
      {copied ? t('share_copied', lang) : t('share_title', lang)}
    </button>
  );
}
