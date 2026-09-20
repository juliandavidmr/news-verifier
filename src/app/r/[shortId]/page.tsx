import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ReportLiveView } from "../../../components/report-live-view";
import { messages } from "../../../lib/i18n";
import { siteName, siteUrl } from "../../../lib/site";
import { NeonReportsRepository } from "../../../server/reports/neon-repository";
import { ReportPublicationRepository } from "../../../server/reports/publication-repository";
import { ReportReaderRepository } from "../../../server/reports/report-reader";
import { toPublicReport } from "../../../server/reports/repository";

export const dynamic = "force-dynamic";

const reportPageData = cache(async (shortId: string) => {
  const report = await new NeonReportsRepository().findByShortId(shortId);
  if (!report) return null;
  let isPubliclyListed = false;
  try {
    isPubliclyListed = await new ReportPublicationRepository().isIndexable(
      report.id,
    );
  } catch {
    console.info("public_report_indexability_unavailable");
  }
  return { report, isPubliclyListed };
});

export async function generateMetadata({
  params,
}: PageProps<"/r/[shortId]">): Promise<Metadata> {
  const { shortId } = await params;
  const data = await reportPageData(shortId);
  if (!data) {
    return { robots: { index: false, follow: false, noarchive: true } };
  }

  const copy = messages[data.report.reportLocale];
  const title = data.report.extractedTitle ?? copy.reportTitle;
  const description = copy.reportSearchDescription;
  const url = new URL(`/r/${data.report.shortId}`, siteUrl).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: data.isPubliclyListed
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function ReportPage({
  params,
}: PageProps<"/r/[shortId]">) {
  const { shortId } = await params;
  const data = await reportPageData(shortId);
  if (!data) notFound();
  const details = await new ReportReaderRepository().findDetails(
    data.report.id,
  );

  return (
    <ReportLiveView
      initialReport={toPublicReport(data.report)}
      initialDetails={details}
      initialPubliclyListed={data.isPubliclyListed}
    />
  );
}
