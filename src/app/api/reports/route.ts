import { after, NextResponse } from "next/server";
import { isSupportedLocale } from "../../../domain/reports";
import { messages } from "../../../lib/i18n";
import { startImageInvestigation } from "../../../server/application/start-image-investigation";
import {
  QuotaExceededError,
  startUrlInvestigation,
} from "../../../server/application/start-url-investigation";
import {
  resolveAnonymousIdentity,
  visitorCookieName,
} from "../../../server/identity/anonymous-visitor";
import { RemoteContentError } from "../../../server/ingestion/public-url";
import {
  ImageValidationError,
  imageUploadLimits,
  validateImageUpload,
} from "../../../server/ocr/image-validation";
import {
  OcrProcessingError,
  TesseractOcrEngine,
} from "../../../server/ocr/tesseract-engine";
import { NeonReportsRepository } from "../../../server/reports/neon-repository";
import { dispatchPendingInvestigations } from "../../../server/research/dispatcher";

export const runtime = "nodejs";
export const maxDuration = 90;

async function readImageBody(request: Request) {
  if (!request.body) throw new ImageValidationError("invalid_image");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > imageUploadLimits.maxBytes) {
        await reader.cancel();
        throw new ImageValidationError("image_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";")[0];
  const identity = resolveAnonymousIdentity(request);
  const json = (payload: unknown, init: ResponseInit) => {
    const response = NextResponse.json(payload, init);
    if (identity.cookie) {
      response.cookies.set(visitorCookieName, identity.cookie, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return response;
  };

  if (contentType?.startsWith("image/")) {
    const reportLocale = request.headers.get("x-report-locale");
    const idempotencyKey = request.headers.get("x-idempotency-key");
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (
      !isSupportedLocale(reportLocale) ||
      !idempotencyKey ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 128
    ) {
      return json({ code: "invalid_request" }, { status: 400 });
    }
    if (declaredLength > imageUploadLimits.maxBytes) {
      return json({ code: "image_too_large" }, { status: 413 });
    }
    let bytes: Uint8Array | undefined;
    let processingScheduled = false;
    try {
      bytes = await readImageBody(request);
      validateImageUpload(bytes, contentType);
      if (process.env.OCR_ARTIFACT_TEST_ONLY === "1") {
        const extracted = await new TesseractOcrEngine().recognize(bytes);
        return json(
          {
            status: "ocr_ready",
            text: extracted.text,
            confidence: extracted.confidence,
            languageSet: extracted.languageSet,
          },
          { status: 200 },
        );
      }
      const imageBytes = bytes;
      const admission = await startImageInvestigation(
        {
          reports: new NeonReportsRepository(),
          backgroundTasks: { defer: (task) => after(task) },
          process: async (reportId) => {
            const reports = new NeonReportsRepository();
            try {
              const extracted = await new TesseractOcrEngine().recognize(
                imageBytes,
              );
              await reports.completeImageOcr(reportId, extracted);
              await dispatchPendingInvestigations(1, reportId);
            } catch (error) {
              const code =
                error instanceof OcrProcessingError ? error.code : "ocr_failed";
              const publicMessage =
                code === "ocr_quality_insufficient"
                  ? messages[reportLocale].ocrQualityInsufficient
                  : code === "ocr_timeout"
                    ? messages[reportLocale].ocrTimeout
                    : messages[reportLocale].ocrFailed;
              await reports.markFailed(reportId, { code, publicMessage });
            } finally {
              imageBytes.fill(0);
            }
          },
        },
        {
          reportLocale,
          visitorKey: identity.visitorKey,
          networkKey: identity.networkKey,
          idempotencyKey,
        },
      );
      processingScheduled = admission.processingScheduled;
      return json(
        {
          shortId: admission.report.shortId,
          status: admission.report.status,
        },
        {
          status: 202,
          headers: { location: `/r/${admission.report.shortId}` },
        },
      );
    } catch (error) {
      if (error instanceof ImageValidationError) {
        return json(
          { code: error.code },
          { status: error.code === "image_too_large" ? 413 : 400 },
        );
      }
      if (error instanceof OcrProcessingError) {
        return json(
          { code: error.code },
          { status: error.code === "ocr_timeout" ? 504 : 422 },
        );
      }
      if (error instanceof QuotaExceededError) {
        return json({ code: `${error.scope}_quota_reached` }, { status: 429 });
      }
      return json({ code: "internal_error" }, { status: 500 });
    } finally {
      if (!processingScheduled) bytes?.fill(0);
    }
  }

  if (contentType !== "application/json") {
    return Response.json({ code: "invalid_request" }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("url" in body) ||
    typeof body.url !== "string" ||
    body.url.length > 2_048 ||
    !("reportLocale" in body) ||
    !isSupportedLocale(body.reportLocale) ||
    !("idempotencyKey" in body) ||
    typeof body.idempotencyKey !== "string" ||
    body.idempotencyKey.length < 8 ||
    body.idempotencyKey.length > 128
  ) {
    return Response.json({ code: "invalid_request" }, { status: 400 });
  }

  try {
    const report = await startUrlInvestigation(
      {
        reports: new NeonReportsRepository(),
        backgroundTasks: { defer: (task) => after(task) },
        dispatch: async (reportId) => {
          await dispatchPendingInvestigations(1, reportId);
        },
      },
      {
        url: body.url,
        reportLocale: body.reportLocale,
        visitorKey: identity.visitorKey,
        networkKey: identity.networkKey,
        idempotencyKey: body.idempotencyKey,
      },
    );

    return json(
      { shortId: report.shortId, status: report.status },
      { status: 202, headers: { location: `/r/${report.shortId}` } },
    );
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return json({ code: `${error.scope}_quota_reached` }, { status: 429 });
    }
    if (error instanceof RemoteContentError) {
      return json({ code: error.code }, { status: 400 });
    }
    return json({ code: "internal_error" }, { status: 500 });
  }
}
