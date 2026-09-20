import { describe, expect, it } from "vitest";
import { REPORT_REMOVAL_EMAIL, reportRemovalMailto } from "./contact";

describe("report removal contact", () => {
  it("builds a prefilled mailto using the shared address", () => {
    const href = reportRemovalMailto({
      shortId: "report-123",
      reportUrl: "https://example.com/r/report-123",
      subject: "Removal request",
      body: "Please review this report:",
    });

    expect(href).toContain(`mailto:${REPORT_REMOVAL_EMAIL}?`);
    expect(href).toContain("subject=Removal+request+report-123");
    expect(href).toContain(
      "body=Please+review+this+report%3A%0A%0Ahttps%3A%2F%2Fexample.com%2Fr%2Freport-123",
    );
  });
});
