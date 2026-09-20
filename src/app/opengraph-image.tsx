import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "News Verifier — traceable evidence for factual claims";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = await readFile(
  join(process.cwd(), "public/brand/contraste-light.png"),
  "base64",
);
const logoSrc = `data:image/png;base64,${logoData}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "68px",
        background: "#f4efdf",
        color: "#17140f",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
        {/* biome-ignore lint/performance/noImgElement: Satori renders local image data in Open Graph output. */}
        <img src={logoSrc} width={86} height={86} alt="" />
        <div style={{ fontSize: "34px", fontWeight: 900 }}>News Verifier</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            maxWidth: "960px",
            fontSize: "76px",
            fontWeight: 900,
            letterSpacing: "-4px",
            lineHeight: 0.98,
          }}
        >
          Check claims against traceable evidence.
        </div>
        <div style={{ fontSize: "27px", color: "#675f53" }}>
          Public links · Screenshots · Claim-by-claim reports
        </div>
      </div>
    </div>,
    size,
  );
}
