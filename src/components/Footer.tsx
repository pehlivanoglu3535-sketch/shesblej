import Link from 'next/link';
import { t, type LangCode } from '@/lib/i18n';

export default function Footer({ lang }: { lang: LangCode }) {
  return (
    <footer className="mt-auto border-t border-glass-border px-6 py-6 text-center text-xs text-muted">
      <p>{t('footer_text', lang)}</p>
      <div className="mt-2 flex justify-center gap-4">
        <Link href="/terms" className="hover:text-white hover:underline">
          {t('footer_terms_link', lang)}
        </Link>
        <Link href="/privacy" className="hover:text-white hover:underline">
          {t('footer_privacy_link', lang)}
        </Link>
      </div>
    </footer>
  );
}
