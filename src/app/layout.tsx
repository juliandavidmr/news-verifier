import type { Metadata } from "next";
import { getRequestLocale } from "../server/request-locale";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "News Verifier",
    template: "%s · News Verifier",
  },
  description:
    "Analyze claims in public pages and screenshots against traceable evidence.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={await getRequestLocale()}>
      <body>{children}</body>
    </html>
  );
}
