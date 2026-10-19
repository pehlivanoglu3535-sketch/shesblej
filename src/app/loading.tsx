/**
 * Ana sayfa yükleme iskeleti.
 *
 * Ana sayfa her istekte veritabanına gidiyor (ilanlar, sayaçlar, yorumlar),
 * yani boş bir an her zaman var. Bu dosya olmadan tarayıcı o süre boyunca
 * bir önceki sayfayı gösteriyordu: kullanıcı tıklıyor ve hiçbir şey olmuyor
 * gibi görünüyor. Gezdiğim platformların hepsinde bu kalıp var.
 *
 * Kutuların ölçüleri gerçek içerikle aynı; aksi halde içerik gelince sayfa
 * zıplar ve kazanılan his kaybedilir.
 */
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-7">
      <div className="sb-skeleton mb-9 h-[232px] rounded-[20px] sm:h-[268px]" />

      <div className="sb-skeleton mb-9 h-[106px] rounded-2xl" />

      <div className="mb-6 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="sb-skeleton h-9 w-28 rounded-full" />
        ))}
      </div>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="sb-skeleton mb-2 h-3 w-24 rounded" />
          <div className="sb-skeleton h-6 w-44 rounded" />
        </div>
        <div className="sb-skeleton h-4 w-16 rounded" />
      </div>

      <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-glass-border bg-surface">
            <div className="sb-skeleton h-[154px]" />
            <div className="p-3.5">
              <div className="sb-skeleton mb-2 h-4 w-full rounded" />
              <div className="sb-skeleton mb-3 h-4 w-2/3 rounded" />
              <div className="flex justify-between">
                <div className="sb-skeleton h-3 w-16 rounded" />
                <div className="sb-skeleton h-3 w-20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
