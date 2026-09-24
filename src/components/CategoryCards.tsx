import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { categoryPhotoUri } from '@/lib/photos';
import { t, catName, catDesc, type LangCode } from '@/lib/i18n';

export default function CategoryCards({ lang }: { lang: LangCode }) {
  return (
    <div className="mb-9">
      <div className="mb-4">
        <span className="mb-1.5 block text-[11px] font-extrabold tracking-[0.14em] text-primary uppercase">
          {t('eyebrow_browse', lang)}
        </span>
        <h2 className="text-xl font-extrabold">{t('categories_title', lang)}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/?category=${c.id}`}
            className="group relative block h-[180px] overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:-translate-y-1"
          >
            <img
              src={categoryPhotoUri(c.id)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.07]"
            />
            <div
              className="absolute inset-0 flex flex-col justify-end p-4.5 text-white"
              style={{ background: 'linear-gradient(180deg,rgba(10,10,8,.05) 35%,rgba(10,10,8,.92))' }}
            >
              {/* Emoji kaldırıldı: kartın kendi çizgi ikonu zaten kategoriyi
                  anlatıyor, ikisi birlikte dağınık duruyordu. */}
              <h3 className="mb-0.5 text-base font-bold">{catName(c.id, lang)}</h3>
              <p className="text-[12.5px] text-[#cbc6ba]">{catDesc(c.id, lang)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
