import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/get-lang";
import { getCurrentUser } from "@/lib/get-user";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header lang={lang} userName={user?.name ?? null} isAdmin={user?.isAdmin ?? false} />
        {children}
        <Footer lang={lang} />
      </body>
    </html>
  );
}
