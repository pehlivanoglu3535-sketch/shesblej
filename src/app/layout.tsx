import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/get-lang";
import { getCurrentUser } from "@/lib/get-user";
import { getUnreadMessageCount } from "@/lib/messages";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleTranslate from "@/components/GoogleTranslate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShesBlej",
  description: "Kosova'nın ilan platformu",
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
      </body>
    </html>
  );
}
