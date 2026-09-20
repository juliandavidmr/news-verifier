import type { Metadata } from "next";
import type { SupportedLocale } from "../domain/reports";

export const siteName = "News Verifier";
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://news-verifier-pi.vercel.app"),
);

export const localeOpenGraph: Record<SupportedLocale, string> = {
  en: "en_US",
  es: "es_CO",
  fr: "fr_FR",
  pt: "pt_BR",
};

export function localizedPath(
  locale: SupportedLocale,
  pathname: "/" | "/methodology" | "/privacy" = "/",
) {
  const suffix = pathname === "/" ? "" : pathname;
  return locale === "en" ? pathname : `/${locale}${suffix}`;
}

export function localizedAlternates(
  locale: SupportedLocale,
  pathname: "/" | "/methodology" | "/privacy" = "/",
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localizedPath(locale, pathname),
    languages: {
      "x-default": localizedPath("en", pathname),
      en: localizedPath("en", pathname),
      es: localizedPath("es", pathname),
      fr: localizedPath("fr", pathname),
      pt: localizedPath("pt", pathname),
    },
  };
}
