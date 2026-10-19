import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    // Listing photos live in Supabase Storage. Serving them through Next's
    // optimizer means Vercel fetches each original once, then serves resized
    // WebP from its own CDN — without this, every card render pulled the full
    // upload straight from Supabase and burned the 5 GB/month egress quota.
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
      // Partner CDN'leri (Encar, Auto Salloni Alberti) burada kayıtlı ama
      // görselleri iyileştiriciden GEÇMİYOR — `unoptimized` ile işaretleniyor,
      // bkz. src/lib/image-source.ts. Yine de kayıtlı olmaları gerekiyor:
      // yapılandırılmamış bir ana makine `next/image` ile sayfayı 500'e
      // düşürüyor (ölçüldü), `unoptimized` bunu değiştirmiyor.
      { protocol: "https" as const, hostname: "ci.encar.com", pathname: "/carpicture/**" },
      // Auto Salloni Alberti (partner inventory). Their photos stay on their
      // own CDN rather than being copied here: this store is meant to track
      // their stock, so a picture they replace should change here too. The
      // RE/MAX import went the other way — those listings were a one-off
      // snapshot, and surviving a deletion on their side was worth more.
      // Alberti 19.10.2026'da autosallonialberti.net -> autoalberti.com'a
      // tasindi. Eski alan adi 301 ile yonlendiriyor ve mevcut 55 ilanin
      // fotograflari oradan geliyor, bu yuzden ikisi de kayitli duruyor.
      { protocol: "https" as const, hostname: "autoalberti.com", pathname: "/assets/inventory/**" },
      { protocol: "https" as const, hostname: "autosallonialberti.net", pathname: "/assets/inventory/**" },
    ],
    // Keep optimized copies at the edge for a month so a popular listing
    // costs Supabase one fetch, not one per visitor.
    minimumCacheTTL: 2678400,
  },

  // Çerçeveyi ve sürümünü dışarı duyurmanın kimseye faydası yok.
  poweredByHeader: false,

  /**
   * Güvenlik başlıkları.
   *
   * Denetimde sitede HSTS dışında hiçbir güvenlik başlığı yoktu; HSTS'i de
   * Vercel kendiliğinden ekliyor. Buradakiler tarayıcıya "bu sayfa nasıl
   * davranmalı" diye söylüyor.
   *
   * CSP'de bilinçli olarak `script-src` KISITLANMIYOR. Next.js'in satır içi
   * önyükleme betikleri nonce ister; nonce'suz sıkı bir `script-src`
   * yazmak siteyi ilk istekte bozar. Onun yerine saldırı yüzeyini gerçekten
   * daraltan ve yanlış yapılandırma riski olmayan yönergeler var:
   * `frame-ancestors` (clickjacking), `object-src` (eklenti tabanlı XSS),
   * `base-uri` (enjekte edilen <base> ile göreli yolların kaçırılması) ve
   * `form-action` (form gönderiminin başka siteye yönlendirilmesi).
   * Nonce tabanlı tam CSP ayrı bir iş.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // Site bunların hiçbirini kullanmıyor; kullanmayan bir sayfanın
            // izin istememesi gerekir.
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            // `default-src` bilerek YOK: yazılsaydı script, stil, görsel,
            // yazı tipi ve fetch'in hepsini aynı anda kısıtlar ve Supabase
            // çağrıları, partner CDN görselleri ve analitik betikleri ilk
            // istekte kesilirdi. Yalnızca kendi başına güvenli olan
            // yönergeler yazılıyor.
            value: [
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
