import type { Metadata } from "next";
import type { SupportedLocale } from "../domain/reports";
import { messages } from "./i18n";
import { seoContent } from "./seo-content";
import {
  localeOpenGraph,
  localizedAlternates,
  localizedPath,
  siteName,
} from "./site";

type PublicPage = "home" | "methodology" | "privacy";

export function publicPageMetadata(
  locale: SupportedLocale,
  page: PublicPage,
): Metadata {
  const copy = messages[locale];
  const seo = seoContent[locale];
  const pathname = page === "home" ? "/" : (`/${page}` as const);
  const title =
    page === "home"
      ? seo.homeTitle
      : page === "methodology"
        ? copy.methodologyTitle
        : copy.privacyTitle;
  const description =
    page === "home"
      ? seo.homeDescription
      : page === "methodology"
        ? seo.methodologyDescription
        : seo.privacyDescription;
  const image = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "News Verifier — traceable evidence for factual claims",
  };

  return {
    title: page === "home" ? { absolute: `${title} · ${siteName}` } : title,
    description,
    alternates: localizedAlternates(locale, pathname),
    openGraph: {
      type: "website",
      title,
      description,
      url: localizedPath(locale, pathname),
      siteName,
      locale: localeOpenGraph[locale],
      images: [image],
      alternateLocale: Object.entries(localeOpenGraph)
        .filter(([candidate]) => candidate !== locale)
        .map(([, value]) => value),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
