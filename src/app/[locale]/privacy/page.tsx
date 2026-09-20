import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPrivacyPage } from "../../../components/public-pages";
import { isSupportedLocale } from "../../../domain/reports";
import { publicPageMetadata } from "../../../lib/page-metadata";

async function localeFrom(params: PageProps<"/[locale]/privacy">["params"]) {
  const { locale } = await params;
  if (locale === "en" || !isSupportedLocale(locale)) notFound();
  return locale;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  return publicPageMetadata(await localeFrom(params), "privacy");
}

export default async function LocalizedPrivacy({
  params,
}: PageProps<"/[locale]/privacy">) {
  return <PublicPrivacyPage locale={await localeFrom(params)} />;
}
