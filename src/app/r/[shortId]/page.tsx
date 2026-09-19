import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportLiveView } from "../../../components/report-live-view";
import { NeonReportsRepository } from "../../../server/reports/neon-repository";
import { ReportReaderRepository } from "../../../server/reports/report-reader";
import { toPublicReport } from "../../../server/reports/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export default async function ReportPage({
  params,
}: PageProps<"/r/[shortId]">) {
  const { shortId } = await params;
  const repository = new NeonReportsRepository();
  const report = await repository.findByShortId(shortId);
  if (!report) notFound();
  const details = await new ReportReaderRepository().findDetails(report.id);

  return (
    <ReportLiveView
      initialReport={toPublicReport(report)}
      initialDetails={details}
    />
  );
}
