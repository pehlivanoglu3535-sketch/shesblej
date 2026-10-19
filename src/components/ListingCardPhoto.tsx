'use client';

import Image from 'next/image';
import { useState } from 'react';
import { isPartnerImage } from '@/lib/image-source';

/**
 * Kart görseli: üstüne gelince ilanın diğer fotoğraflarını gösteriyor.
 *
 * Bu kalıbı hem bayinin kendi sitesinde (kartın `data-gal` özniteliğiyle
 * fotoğraf şeridi) hem mobile.de'nin "Top Deals" sırasında gördüm. İşe
 * yaramasının sebebi şu: elimizdeki ilanların çoğunda 10-19 fotoğraf var
 * ama ızgarada bir tanesi görünüyor. Kullanıcı aracın içini görmek için
 * ilana girmek zorunda kalıyor.
 *
 * NEDEN DÖRT FOTOĞRAF
 * Tamamını önceden yüklemek 19 fotoğraflı bir ilanda kartı tek başına
 * megabaytlara çıkarır. Dördü, "bu ilanda daha fazlası var" hissini
 * vermeye yetiyor.
 *
 * NEDEN YALNIZ ÜSTÜNE GELİNCE
 * Fotoğraflar `onMouseEnter` olmadan hiç istenmiyor. Yani telefonda ve
 * sayfayı sadece kaydıran kullanıcıda fazladan tek bayt inmiyor;
 * dokunmatik cihazda `hover` zaten tetiklenmiyor.
 */
export default function ListingCardPhoto({
  photos,
  alt,
  sizes,
}: {
  photos: string[];
  alt: string;
  sizes: string;
}) {
  const preview = photos.slice(0, 4);
  const [index, setIndex] = useState(0);
  const [warm, setWarm] = useState(false);

  function enter() {
    setWarm(true);
  }
  function leave() {
    setIndex(0);
  }
  /** Görselin üstünde yatay konum hangi fotoğrafa denk geliyorsa onu göster
   *  — şeridi otomatik oynatmak yerine kullanıcıya bırakmak, fareyi
   *  gezdirirken aradığı kareyi bulmasını sağlıyor. */
  function move(e: React.MouseEvent<HTMLDivElement>) {
    if (preview.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const next = Math.min(preview.length - 1, Math.max(0, Math.floor(ratio * preview.length)));
    setIndex(next);
  }

  return (
    <div className="absolute inset-0" onMouseEnter={enter} onMouseMove={move} onMouseLeave={leave}>
      {preview.map((src, i) => (
        // İlk fotoğraf her zaman basılıyor; diğerleri ancak fare karta
        // girdikten sonra DOM'a ekleniyor, yani o ana kadar istenmiyor.
        (i === 0 || warm) && (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? alt : ''}
            fill
            sizes={sizes}
            unoptimized={isPartnerImage(src)}
            className={`object-cover transition-opacity duration-200 group-hover:scale-[1.08] ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )
      ))}

      {photos.length > 1 && (
        <span
          className="pointer-events-none absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded-lg border border-glass-border px-2 py-0.5 text-[10px] font-bold text-[#d6d1c4] backdrop-blur-sm"
          style={{ background: 'rgba(10,10,8,.72)' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="12" cy="12" r="3.2" />
          </svg>
          {photos.length}
        </span>
      )}

      {/* Önizlemedeki konumu gösteren ince şerit. Yalnız fare kartın
          üstündeyken görünüyor. */}
      {preview.length > 1 && (
        <span className="pointer-events-none absolute inset-x-2 top-2 hidden gap-1 group-hover:flex">
          {preview.map((src, i) => (
            <span
              key={src}
              className={`h-[2.5px] flex-1 rounded-full transition-colors ${
                i === index ? 'bg-primary' : 'bg-white/30'
              }`}
            />
          ))}
        </span>
      )}
    </div>
  );
}
