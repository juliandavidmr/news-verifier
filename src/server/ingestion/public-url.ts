import { lookup as dnsLookup } from "node:dns";
import { promisify } from "node:util";
import ipaddr from "ipaddr.js";
import { Agent, request } from "undici";

const lookupAll = promisify(dnsLookup);
const allowedContentTypes = [
  "text/html",
  "application/xhtml+xml",
  "text/plain",
];

export const remoteFetchLimits = {
  maxBytes: 2_000_000,
  maxRedirects: 4,
  timeoutMs: 10_000,
} as const;

export class RemoteContentError extends Error {
  constructor(
    readonly code:
      | "invalid_url"
      | "blocked_destination"
      | "unreachable"
      | "too_many_redirects"
      | "unsupported_content"
      | "content_too_large"
      | "http_error",
    message: string,
  ) {
    super(message);
    this.name = "RemoteContentError";
  }
}

export type RemoteDocument = {
  finalUrl: string;
  contentType: string;
  body: string;
};

export interface RemoteDocumentFetcher {
  fetch(url: URL): Promise<RemoteDocument>;
}

export function parsePublicHttpUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new RemoteContentError("invalid_url", "The URL is not valid");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new RemoteContentError(
      "invalid_url",
      "Only HTTP and HTTPS URLs are supported",
    );
  }
  if (url.username || url.password) {
    throw new RemoteContentError(
      "invalid_url",
      "URLs with embedded credentials are not supported",
    );
  }
  if (!url.hostname || isBlockedHostname(url.hostname)) {
    throw new RemoteContentError(
      "blocked_destination",
      "The destination is not public",
    );
  }
  url.hash = "";
  return url;
}

export function isBlockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/u, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized === "metadata.google.internal"
  );
}

export function isPublicAddress(address: string) {
  try {
    let parsed = ipaddr.parse(address);
    if (parsed.kind() === "ipv6") {
      const ipv6 = parsed as ipaddr.IPv6;
      if (ipv6.isIPv4MappedAddress()) parsed = ipv6.toIPv4Address();
    }
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

async function resolvePublicAddresses(hostname: string) {
  if (isBlockedHostname(hostname)) {
    throw new RemoteContentError(
      "blocked_destination",
      "The destination is not public",
    );
  }

  if (ipaddr.isValid(hostname)) {
    if (!isPublicAddress(hostname)) {
      throw new RemoteContentError(
        "blocked_destination",
        "The destination is not public",
      );
    }
    const parsed = ipaddr.parse(hostname);
    return [{ address: hostname, family: parsed.kind() === "ipv6" ? 6 : 4 }];
  }

  let addresses: Awaited<ReturnType<typeof lookupAll>>;
  try {
    addresses = await lookupAll(hostname, { all: true, verbatim: true });
  } catch {
    throw new RemoteContentError(
      "unreachable",
      "The host could not be resolved",
    );
  }

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => !isPublicAddress(address))
  ) {
    throw new RemoteContentError(
      "blocked_destination",
      "The host resolves to a non-public address",
    );
  }
  return addresses;
}

function createPinnedAgent() {
  return new Agent({
    connect: {
      lookup(hostname, options, callback) {
        resolvePublicAddresses(hostname)
          .then((addresses) => {
            if (options.all) {
              callback(null, addresses);
              return;
            }
            const first = addresses[0];
            callback(null, first.address, first.family);
          })
          .catch((error: unknown) => callback(error as Error, "", 4));
      },
    },
  });
}

async function readLimitedBody(
  body: AsyncIterable<Uint8Array>,
  maxBytes: number,
) {
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of body) {
    total += chunk.byteLength;
    if (total > maxBytes) {
      throw new RemoteContentError(
        "content_too_large",
        "The remote page is too large",
      );
    }
    chunks.push(chunk);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export class SafeRemoteDocumentFetcher implements RemoteDocumentFetcher {
  async fetch(initialUrl: URL) {
    let current = parsePublicHttpUrl(initialUrl.toString());

    for (
      let redirect = 0;
      redirect <= remoteFetchLimits.maxRedirects;
      redirect += 1
    ) {
      const agent = createPinnedAgent();
      try {
        const response = await request(current, {
          dispatcher: agent,
          method: "GET",
          headers: {
            accept: "text/html,application/xhtml+xml,text/plain;q=0.8",
            "user-agent":
              "NewsVerifierBot/0.1 (+https://news-verifier-pi.vercel.app)",
          },
          signal: AbortSignal.timeout(remoteFetchLimits.timeoutMs),
        });

        if (response.statusCode >= 300 && response.statusCode < 400) {
          const location = response.headers.location;
          await response.body.dump();
          if (!location) {
            throw new RemoteContentError(
              "http_error",
              "Redirect without location",
            );
          }
          if (redirect === remoteFetchLimits.maxRedirects) {
            throw new RemoteContentError(
              "too_many_redirects",
              "The page redirected too many times",
            );
          }
          const redirectTarget = Array.isArray(location)
            ? location[0]
            : location;
          current = parsePublicHttpUrl(
            new URL(redirectTarget, current).toString(),
          );
          continue;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          await response.body.dump();
          throw new RemoteContentError(
            "http_error",
            `The page returned HTTP ${response.statusCode}`,
          );
        }

        const declaredLength = Number(response.headers["content-length"] ?? 0);
        if (declaredLength > remoteFetchLimits.maxBytes) {
          await response.body.dump();
          throw new RemoteContentError(
            "content_too_large",
            "The remote page is too large",
          );
        }

        const contentType = String(response.headers["content-type"] ?? "")
          .split(";")[0]
          .trim()
          .toLowerCase();
        if (!allowedContentTypes.includes(contentType)) {
          await response.body.dump();
          throw new RemoteContentError(
            "unsupported_content",
            "The URL does not point to a supported text page",
          );
        }

        return {
          finalUrl: current.toString(),
          contentType,
          body: await readLimitedBody(
            response.body,
            remoteFetchLimits.maxBytes,
          ),
        };
      } catch (error) {
        if (error instanceof RemoteContentError) throw error;
        throw new RemoteContentError(
          "unreachable",
          "The page could not be fetched",
        );
      } finally {
        await agent.close();
      }
    }

    throw new RemoteContentError(
      "too_many_redirects",
      "The page redirected too many times",
    );
  }
}
