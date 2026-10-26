/**
 * Yasal sayfalar için küçük markdown çevirici.
 *
 * NEDEN KÜTÜPHANE DEĞİL
 * İhtiyaç üç şeyden ibaret: başlık, kalın yazı, madde listesi ve bağlantı.
 * Bunun için bir markdown paketi kurmak, yalnızca bizim yazdığımız üç metni
 * basmak uğruna istemciye kilobaytlarca kod ve bir güvenlik yüzeyi eklerdi.
 *
 * NEDEN ORTAK DOSYA
 * Aynı fonksiyon `privacy` ve `terms` sayfalarında ayrı ayrı kopyalanmıştı.
 * Hesap silme sayfası üçüncü kopya olacaktı; madde listesi desteği de yalnız
 * bir kopyaya eklenseydi diğer sayfalarda tireli düz satırlar görünürdü.
 */
import type { ReactNode } from 'react';

/** Satır içi `**kalın**` ve `[metin](adres)` biçimlerini çözer. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  function pushText(chunk: string, key: string) {
    chunk.split('**').forEach((part, j) => {
      if (!part) return;
      parts.push(j % 2 === 1 ? <strong key={`${key}-${j}`}>{part}</strong> : part);
    });
  }

  while ((match = linkPattern.exec(text)) !== null) {
    pushText(text.slice(last, match.index), `${keyPrefix}-t${match.index}`);
    parts.push(
      <a
        key={`${keyPrefix}-a${match.index}`}
        href={match[2]}
        className="text-primary underline underline-offset-2"
      >
        {match[1]}
      </a>,
    );
    last = match.index + match[0].length;
  }
  pushText(text.slice(last), `${keyPrefix}-tail`);
  return parts;
}

/**
 * Bir bloğun gövdesini basar: sıralı liste, madde listesi veya paragraf.
 *
 * Başlıktan ayrı tutuluyor, çünkü yasal metinlerde başlık ile gövde arasında
 * boş satır yok ve ikisi aynı bloğa düşüyor.
 */
function body(block: string, key: string) {
  const lines = block.split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return null;

  const li = 'text-sm leading-relaxed text-[#cbc6ba]';

  if (lines.every((l) => /^\d+\.\s/.test(l))) {
    return (
      <ol key={`${key}-ol`} className="mb-3 ml-5 list-decimal space-y-1.5">
        {lines.map((l, j) => (
          <li key={j} className={li}>
            {inline(l.replace(/^\d+\.\s/, ''), `${key}-${j}`)}
          </li>
        ))}
      </ol>
    );
  }

  if (lines.every((l) => l.startsWith('- '))) {
    return (
      <ul key={`${key}-ul`} className="mb-3 ml-4 list-disc space-y-1.5">
        {lines.map((l, j) => (
          <li key={j} className={li}>
            {inline(l.slice(2), `${key}-${j}`)}
          </li>
        ))}
      </ul>
    );
  }

  // Tek yıldızlı satır — "Përditësuar së fundmi" gibi künye satırları.
  if (lines.length === 1 && lines[0].startsWith('**')) {
    return (
      <p key={`${key}-meta`} className="mb-2 text-sm text-muted">
        {lines[0].replace(/\*\*/g, '')}
      </p>
    );
  }

  return (
    <p key={`${key}-p`} className="mb-2 text-sm leading-relaxed text-[#cbc6ba]">
      {inline(lines.join(' '), key)}
    </p>
  );
}

export function renderMarkdownLite(text: string) {
  return text
    .trim()
    .split('\n\n')
    .map((block, i) => {
      const [first, ...rest] = block.split('\n');

      // Başlık satırı bloğun gerisinden ayrılıyor.
      //
      // Önceki sürüm bütün bloğu başlık olarak basıyordu: metinlerde başlıkla
      // gövde arasında boş satır olmadığı için gizlilik ve şartlar
      // sayfalarının HER bölümü tek bir kalın satır hâlinde çıkıyordu —
      // on bir paragraf, on bir <h2> içinde. Canlıdaki hâli de buydu.
      if (first.startsWith('## ') || first.startsWith('### ')) {
        const isH1 = first.startsWith('## ');
        const Heading = isH1 ? 'h1' : 'h2';
        return (
          <div key={i}>
            <Heading className={isH1 ? 'mb-4 text-2xl font-extrabold' : 'mt-6 mb-2 text-lg font-bold'}>
              {first.replace(/^#{2,3}\s/, '')}
            </Heading>
            {body(rest.join('\n'), String(i))}
          </div>
        );
      }

      return <div key={i}>{body(block, String(i))}</div>;
    });
}
