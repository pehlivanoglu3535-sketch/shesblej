'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Sayıyı sıfırdan hedefe sayar.
 *
 * MerrJep ana sayfasında "2.570.591 shpallje" yazıyor, AutoScout24 arama
 * düğmesinin üstünde sonuç sayısını canlı gösteriyor. İkisi de aynı işi
 * yapıyor: platformun boş olmadığını ilk saniyede söylüyor. Durağan bir
 * rakam da bunu söyler ama gözü yakalamaz.
 *
 * NEDEN BAŞLANGIÇ DEĞERİ HEDEFİN KENDİSİ
 * Sunucu gerçek sayıyı basıyor ve istemci de ilk render'da aynı sayıyı
 * basıyor — yoksa hidrasyon uyuşmazlığı olurdu. Sıfıra inip saymak ancak
 * eleman ekrana girdiğinde, yani bir geri çağrının içinde başlıyor.
 * Betik çalışmazsa ya da gözlemci yoksa sayı doğru değerinde kalıyor;
 * hiçbir şey kaybolmuyor.
 *
 * Sayma ekrana girince başlıyor: sayfanın altındaki bir rakamın kimse
 * bakmazken sayması anlamsız.
 */
export default function CountUp({ to, durationMs = 1100 }: { to: number; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || to <= 0) return;
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / durationMs);
          // Sona doğru yavaşlayan eğri; doğrusal sayım mekanik duruyor.
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(to * eased));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, durationMs]);

  return <span ref={ref}>{value.toLocaleString('de-DE')}</span>;
}
