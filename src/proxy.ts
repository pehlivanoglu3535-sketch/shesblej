import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';

  /**
   * www → kök alan adı yönlendirmesi.
   *
   * Vercel'de hem `shesblejks.com` hem `www.shesblejks.com` aynı uygulamayı
   * 200 ile sunuyordu. İkisi ayrı site gibi göründüğü için arama motoru
   * sinyalleri bölünür ve "kopya içerik" riski doğar. Kanonik adres www'siz
   * olduğundan (robots.txt, sitemap.xml, canonical etiketleri) burada
   * kalıcı yönlendirme yapılıyor.
   *
   * Yerel geliştirme (localhost) ve Vercel önizleme adresleri etkilenmez:
   * yalnızca "www." ile başlayan ana makine adları yönlendirilir.
   */
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.host = host.slice(4);
    url.protocol = 'https';
    return NextResponse.redirect(url, 301);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
