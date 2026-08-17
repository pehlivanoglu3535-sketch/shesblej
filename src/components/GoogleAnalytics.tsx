// Google Analytics 4 (GA4) — organik trafik ölçümü.
// Ölçüm kimliği ortam değişkeninden okunur: NEXT_PUBLIC_GA_ID (örn. "G-XXXXXXXXXX").
// Kimlik tanımlı değilse hiçbir şey render edilmez; site normal çalışmaya devam eder.
// GA4 mülkünü açtıktan sonra kimliği ortam değişkenlerine ekleyin (Vercel: Project → Settings → Environment Variables).

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
        }}
      />
    </>
  );
}
