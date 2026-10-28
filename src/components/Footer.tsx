import Link from 'next/link';
import { t, catName, type LangCode } from '@/lib/i18n';
import { CATEGORY_SLUGS, CITY_SLUGS, categoryPath, cityPath } from '@/lib/taxonomy';

/**
 * Alt bilgi.
 *
 * Kategori ve şehir bağlantıları buraya eklendi: site genelinde görünen tek
 * iç linkleme alanı burası. Arama motoru botu ana sayfadan bu bağlantılarla
 * /kategori/* ve /qyteti/* sayfalarına tek tıkla ulaşıyor, kullanıcı da
 * menüyü açmadan şehir/kategori değiştirebiliyor.
 */
export default function Footer({ lang }: { lang: LangCode }) {
  return (
    <footer className="mt-auto border-t border-glass-border px-6 py-6 text-center text-xs text-muted">
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {CATEGORY_SLUGS.map((slug) => (
          <Link key={slug} href={categoryPath(slug)} className="font-bold hover:text-primary hover:underline">
            {catName(slug, lang)}
          </Link>
        ))}
      </div>

      <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {CITY_SLUGS.map((entry) => (
          <Link key={entry.slug} href={cityPath(entry.city)} className="hover:text-white hover:underline">
            {entry.city}
          </Link>
        ))}
      </div>

      <p className="mt-4">{t('footer_text', lang)}</p>
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
