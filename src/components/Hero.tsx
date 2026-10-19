import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { t, catName, type LangCode } from '@/lib/i18n';
import CategoryIcon from './CategoryIcon';

export default function Hero({ lang }: { lang: LangCode }) {
  return (
    <div
      className="relative mb-9 overflow-hidden rounded-[20px] border border-glass-border p-6 text-white sm:p-14"
      style={{ background: 'linear-gradient(150deg,#201c10,#0a0a08 70%)' }}
    >
      {/* Iki isik yavasca suzuluyor. Sabitken alan oluydu; mobile.de ve
          AutoScout24 burada fotograf kullaniyor, biz fotograf koymuyoruz
          cunku her goruntuleme bant genisligi demek ve bu alan her ana
          sayfa acilisinda yukleniyor. Isik hic bayt maliyeti olmadan ayni
          canliligi veriyor. */}
      <div
        className="sb-aurora pointer-events-none absolute -top-24 -right-20 h-[340px] w-[340px] rounded-full blur-sm"
        style={{ background: 'radial-gradient(circle, rgba(255,212,0,.24), transparent 70%)' }}
      />
      <div
        className="sb-aurora-2 pointer-events-none absolute -bottom-28 -left-16 h-[300px] w-[300px] rounded-full blur-sm"
        style={{ background: 'radial-gradient(circle, rgba(255,157,0,.20), transparent 70%)' }}
      />
      <div className="sb-rise relative z-10 max-w-xl">
        <h1 className="mb-3 text-2xl leading-tight font-extrabold tracking-tight sm:text-4xl">{t('hero_title', lang)}</h1>
        <p className="text-base text-[#b8b3a6]">{t('hero_subtitle', lang)}</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/?category=${c.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-white/7 px-4 py-2 text-sm font-semibold hover:bg-primary hover:text-ink hover:border-primary"
            >
              <CategoryIcon id={c.id} />
              {catName(c.id, lang)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
