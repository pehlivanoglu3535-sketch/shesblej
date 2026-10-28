// Microsoft Clarity — ücretsiz oturum kaydı + ısı haritası.
// Proje kimliği ortam değişkeninden okunur: NEXT_PUBLIC_CLARITY_ID (clarity.microsoft.com → Settings → Overview → "Project ID").
// Kimlik tanımlı değilse hiçbir şey render edilmez; site normal çalışmaya devam eder.
// Clarity projesini açtıktan sonra kimliği ortam değişkenlerine ekleyin (Vercel: Project → Settings → Environment Variables), başka bir şey yapmanıza gerek yok.

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export default function MicrosoftClarity() {
  // Kimlik yalnızca harf/rakamdan oluşur; başka bir şey gelirse satır içi betiğe yazılmaz.
  if (!CLARITY_ID || !/^[a-z0-9]+$/i.test(CLARITY_ID)) return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`,
      }}
    />
  );
}
