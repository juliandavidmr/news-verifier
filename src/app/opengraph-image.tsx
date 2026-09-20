import { ImageResponse } from "next/og";

export const alt = "News Verifier — traceable evidence for factual claims";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
        <div
          style={{
            width: "72px",
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "4px solid #17140f",
            background: "#ff5c35",
            boxShadow: "8px 8px 0 #17140f",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "7px",
            }}
          >
            <div
              style={{ width: "8px", height: "18px", background: "#17140f" }}
            />
            <div
              style={{ width: "8px", height: "30px", background: "#17140f" }}
            />
            <div
              style={{ width: "8px", height: "42px", background: "#17140f" }}
            />
          </div>
        </div>
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
