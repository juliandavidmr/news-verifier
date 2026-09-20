import type { MetadataRoute } from "next";
import type { SupportedLocale } from "../domain/reports";
import { localizedPath, siteUrl } from "../lib/site";

const locales: SupportedLocale[] = ["en", "es", "fr", "pt"];
const pages = [
  { pathname: "/" as const, priority: 1, changeFrequency: "weekly" as const },
  {
    pathname: "/methodology" as const,
    priority: 0.8,
    changeFrequency: "monthly" as const,
  },
  {
    pathname: "/privacy" as const,
    priority: 0.3,
    changeFrequency: "yearly" as const,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-20T00:00:00.000Z");

  return pages.flatMap((page) => {
    const languages = Object.fromEntries(
      locales.map((locale) => [
        locale,
        new URL(localizedPath(locale, page.pathname), siteUrl).toString(),
      ]),
    );

    return locales.map((locale) => ({
      url: new URL(localizedPath(locale, page.pathname), siteUrl).toString(),
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          "x-default": languages.en,
          ...languages,
        },
      },
    }));
  });
}
