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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4efdf",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={await getRequestLocale()}>
      <body>{children}</body>
    </html>
  );
}
