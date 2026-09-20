import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHomePage } from "../../components/public-pages";
import { isSupportedLocale } from "../../domain/reports";
import { publicPageMetadata } from "../../lib/page-metadata";

async function localeFrom(params: PageProps<"/[locale]">["params"]) {
  const { locale } = await params;
  if (locale === "en" || !isSupportedLocale(locale)) notFound();
  return locale;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  return publicPageMetadata(await localeFrom(params), "home");
}

export default async function LocalizedHome({
  params,
}: PageProps<"/[locale]">) {
  return <PublicHomePage locale={await localeFrom(params)} />;
}
