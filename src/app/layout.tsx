import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "News Verifier",
    template: "%s · News Verifier",
  },
  description:
    "Analyze claims in public pages and screenshots against traceable evidence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
