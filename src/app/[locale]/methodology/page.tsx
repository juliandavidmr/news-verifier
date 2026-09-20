import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicMethodologyPage } from "../../../components/public-pages";
import { isSupportedLocale } from "../../../domain/reports";
import { publicPageMetadata } from "../../../lib/page-metadata";

async function localeFrom(
  params: PageProps<"/[locale]/methodology">["params"],
) {
  const { locale } = await params;
  if (locale === "en" || !isSupportedLocale(locale)) notFound();
  return locale;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/methodology">): Promise<Metadata> {
  return publicPageMetadata(await localeFrom(params), "methodology");
}

export default async function LocalizedMethodology({
  params,
}: PageProps<"/[locale]/methodology">) {
  return <PublicMethodologyPage locale={await localeFrom(params)} />;
}
