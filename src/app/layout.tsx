import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";
import { getLang } from "@/lib/get-lang";
import { getCurrentUser } from "@/lib/get-user";
import { getUnreadMessageCount } from "@/lib/messages";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleTranslate from "@/components/GoogleTranslate";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import MicrosoftClarity from "@/components/MicrosoftClarity";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Kanonik alan adı. Yardımcı fonksiyon, yereldeki localhost değerinin
 * yayın adresini ezmesini engelliyor (bkz. src/lib/site.ts). metadataBase
 * olmadan Next.js openGraph/canonical gibi göreli adresleri mutlak URL'ye
 * çeviremiyor ve paylaşım kartları boş çıkıyor.
 */
const SITE_URL = getSiteUrl();

const SITE_TITLE = "ShesBlej — Kosova'nın ilan platformu";
const SITE_DESCRIPTION =
  "Kosova'da satılık/kiralık daire, araç ve ikinci el eşya ilanları. Ücretsiz ilan ver, satıcıyla doğrudan iletişime geç.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "ShesBlej",
  title: {
    default: SITE_TITLE,
    // Alt sayfalar kendi başlığını verir; marka adı buradan eklenir.
    template: "%s | ShesBlej",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ShesBlej",
    locale: "tr_TR",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "ShesBlej" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-default.png"],
  },
  robots: { index: true, follow: true },
  // Google Search Console doğrulaması — ortam değişkeninden okunur.
  // NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION tanımlı değilse eklenmez.
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  const user = await getCurrentUser();
  const unreadCount = user ? await getUnreadMessageCount(user.id) : 0;

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GoogleTranslate siteLang={lang} />
        <Header
          lang={lang}
          userId={user?.id ?? null}
          userName={user?.name ?? null}
          isAdmin={user?.isAdmin ?? false}
          initialUnreadCount={unreadCount}
        />
        {children}
        <Footer lang={lang} />
        <GoogleAnalytics />
        <MicrosoftClarity />
      </body>
    </html>
  );
}
