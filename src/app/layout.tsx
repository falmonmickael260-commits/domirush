import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Domirush — Le domino, à plusieurs, en ligne",
  description:
    "Domirush : jouez au domino traditionnel en ligne entre amis et en famille, sur une véritable table virtuelle premium.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#12100e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text">{children}</body>
    </html>
  );
}
