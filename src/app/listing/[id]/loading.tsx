/**
 * İlan detayı yükleme iskeleti.
 *
 * Bu sayfa tek istekte beş sorgu yapıyor (ilan, mağaza, benzer ilanlar,
 * sahip profili, favori durumu). Izgaradan bir ilana tıklandığında arada
 * görünür bir boşluk oluyor; iskelet o boşluğu sayfanın iskeletiyle
 * dolduruyor, böylece asıl içerik geldiğinde göz zaten doğru yere bakmış
 * oluyor.
 */
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="sb-skeleton mb-3 h-3 w-48 rounded" />
      <div className="sb-skeleton mb-2 h-8 w-3/4 rounded" />
      <div className="sb-skeleton mb-5 h-5 w-1/3 rounded" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-glass-border bg-surface p-4">
            <div className="sb-skeleton h-[260px] rounded-lg sm:h-[340px]" />
            <div className="mt-2 flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="sb-skeleton h-14 w-14 rounded-md" />
              ))}
            </div>
            <div className="sb-skeleton mt-4 h-5 w-40 rounded-full" />
            <div className="sb-skeleton mt-3 h-8 w-36 rounded" />
            <div className="sb-skeleton mt-2 h-4 w-64 rounded" />
          </div>

          <div className="rounded-2xl border border-glass-border bg-surface p-5">
            <div className="sb-skeleton mb-3 h-4 w-28 rounded" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="sb-skeleton mb-2 h-4 w-full rounded" />
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-glass-border bg-surface p-5">
            <div className="sb-skeleton mb-3 h-4 w-32 rounded" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between gap-3 py-2">
                <div className="sb-skeleton h-3 w-20 rounded" />
                <div className="sb-skeleton h-3 w-16 rounded" />
              </div>
            ))}
          </div>
          <div className="sb-skeleton h-28 rounded-2xl" />
        </aside>
      </div>
    </main>
  );
}
