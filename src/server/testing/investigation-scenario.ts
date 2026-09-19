import { startUrlInvestigation } from "../application/start-url-investigation";
import type { RemoteDocument } from "../ingestion/public-url";
import { InMemoryReportsRepository } from "./in-memory-reports";

export class InvestigationScenario {
  readonly reports = new InMemoryReportsRepository();
  private readonly tasks: Array<() => Promise<void>> = [];
  private remoteDocument: RemoteDocument = {
    finalUrl: "https://example.com/story",
    contentType: "text/html",
    body: `<html><head><title>Example story</title></head><body><article>
      <h1>Example story</h1>
      <p>The city published a detailed public report on Friday.</p>
      <p>The document contains enough context for this deterministic extraction scenario.</p>
    </article></body></html>`,
  };

  givenRemoteDocument(document: RemoteDocument) {
    this.remoteDocument = document;
    return this;
  }

  async startUrl(url = "https://example.com/story") {
    return startUrlInvestigation(
      {
        reports: this.reports,
        fetcher: { fetch: async () => this.remoteDocument },
        backgroundTasks: { defer: (task) => this.tasks.push(task) },
        createShortId: () => "scenario1234",
      },
      { url, reportLocale: "en" },
    );
  }

  async runBackgroundTasks() {
    for (const task of this.tasks.splice(0)) await task();
  }
}
