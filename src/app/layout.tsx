import type { Metadata, Viewport } from "next";
import { siteName, siteUrl } from "../lib/site";
import { getRequestLocale } from "../server/request-locale";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description:
    "Analyze claims in public pages and screenshots against traceable evidence.",
  category: "technology",
  referrer: "strict-origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/brand/icon-light-32.png",
        media: "(prefers-color-scheme: light)",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/brand/icon-dark-32.png",
        media: "(prefers-color-scheme: dark)",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    shortcut: "/favicon.ico",
    apple: {
      url: "/brand/apple-touch-icon.png",
      type: "image/png",
      sizes: "180x180",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efdf" },
    { media: "(prefers-color-scheme: dark)", color: "#17140f" },
  ],
  colorScheme: "light dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={await getRequestLocale()}>
      <body>{children}</body>
    </html>
  );
}
