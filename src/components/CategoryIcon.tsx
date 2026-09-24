/**
 * Kategori rozetleri için küçük çizgi ikonlar.
 *
 * Emoji yerine bunlar kullanılıyor: emoji her işletim sisteminde başka
 * çiziliyor (Windows'ta düz renkli, macOS'ta parlak 3B) ve sitenin altın
 * çizgi diliyle çelişiyordu. Bunlar `photos.ts` içindeki kategori
 * görselleriyle aynı dili konuşuyor, sadece 18px'e sadeleştirilmiş hali.
 *
 * Renk `currentColor`: rozet üzerine gelince zemin altın olup yazı
 * koyulaşıyor, ikon da kendiliğinden onunla birlikte dönüyor.
 */
import type { CategoryId } from '@/lib/constants';

const PATHS: Record<CategoryId, React.ReactNode> = {
  emlak: (
    <>
      <path d="M3.4 10.8 12 4.2l8.6 6.6" />
      <path d="M5.6 9.9V19h12.8V9.9" />
      <path d="M10.2 19v-4.4h3.6V19" />
    </>
  ),
  vasita: (
    <>
      <path d="M2.5 14.2v-2.6q0-1.2 1.2-1.6l3.3-1 2.1-2.9q.6-.9 1.7-.9h2.4q1.1 0 1.7.9l2.1 2.9 3.3 1q1.2.4 1.2 1.6v2.6" />
      <path d="M7.7 9.1h8.6" opacity=".55" />
      <circle cx="7" cy="16" r="2.1" />
      <circle cx="17" cy="16" r="2.1" />
    </>
  ),
  esya: (
    <>
      <path d="M12 3.6 19.6 7.4v8.4L12 19.6 4.4 15.8V7.4z" />
      <path d="M4.4 7.4 12 11.2l7.6-3.8" opacity=".8" />
      <path d="M12 11.2v8.4" opacity=".8" />
    </>
  ),
};

export default function CategoryIcon({ id, className = '' }: { id: CategoryId; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`inline-block h-[18px] w-[18px] shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[id]}
    </svg>
  );
}
