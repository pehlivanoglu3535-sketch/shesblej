'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { isPartnerImage } from '@/lib/image-source';

/**
 * İlan fotoğraf galerisi.
 *
 * Önceden büyük görselin altındaki küçük kareler sadece birer resimdi; ilana 20
 * fotoğraf eklendikten sonra kullanıcı ilk kareden ötesini göremiyordu. Burada
 * küçük kareler tıklanabilir, ayrıca ok tuşları ve görselin üzerindeki oklarla
 * da gezilebiliyor.
 */
export default function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const total = photos.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + total) % total),
    [total]
  );

  useEffect(() => {
    if (total < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, total]);

  if (total === 0) return null;

  return (
    <div>
      <div className="relative h-[260px] overflow-hidden rounded-lg bg-[#1c1a12] sm:h-[340px]">
        <Image
          key={photos[index]}
          src={photos[index]}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          unoptimized={isPartnerImage(photos[index])}
          priority
          className="object-cover"
        />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Önceki fotoğraf"
              className="absolute top-1/2 left-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-glass-border text-lg font-bold text-white backdrop-blur-sm hover:bg-black/70"
              style={{ background: 'rgba(10,10,8,.6)' }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Sonraki fotoğraf"
              className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-glass-border text-lg font-bold text-white backdrop-blur-sm hover:bg-black/70"
              style={{ background: 'rgba(10,10,8,.6)' }}
            >
              ›
            </button>
            <span
              className="absolute right-2.5 bottom-2.5 rounded-lg border border-glass-border px-2.5 py-1 text-[11px] font-bold text-[#d6d1c4] backdrop-blur-sm"
              style={{ background: 'rgba(10,10,8,.72)' }}
            >
              {index + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Fotoğraf ${i + 1}`}
              className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border transition ${
                i === index ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={p} alt="" fill sizes="56px" unoptimized={isPartnerImage(p)} className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
