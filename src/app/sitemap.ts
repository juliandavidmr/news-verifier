import type { MetadataRoute } from "next";
import type { SupportedLocale } from "../domain/reports";
import { localizedPath, siteUrl } from "../lib/site";
import { ReportPublicationRepository } from "../server/reports/publication-repository";

export const dynamic = "force-dynamic";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date("2026-09-20T00:00:00.000Z");

  const publicPages = pages.flatMap((page) => {
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

  try {
    const reports = await new ReportPublicationRepository().listIndexable();
    return [
      ...publicPages,
      ...reports.map((report) => ({
        url: new URL(`/r/${report.shortId}`, siteUrl).toString(),
        lastModified: new Date(report.completedAt),
        changeFrequency: "never" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    console.error("public_report_sitemap_unavailable");
    return publicPages;
  }
}
