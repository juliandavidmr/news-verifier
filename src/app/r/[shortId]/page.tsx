import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportLiveView } from "../../../components/report-live-view";
import { NeonReportsRepository } from "../../../server/reports/neon-repository";
import { toPublicReport } from "../../../server/reports/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ReportPage({
  params,
}: PageProps<"/r/[shortId]">) {
  const { shortId } = await params;
  const repository = new NeonReportsRepository();
  const report = await repository.findByShortId(shortId);
  if (!report) notFound();

  return <ReportLiveView initialReport={toPublicReport(report)} />;
}
