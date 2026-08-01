import { ImageResponse } from "next/og";

export const alt = "Azhar | Automate Anything — AI Automation Specialist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#09090b",
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 32,
            color: "#a1a1aa",
          }}
        >
          <span
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 999,
              marginRight: 12,
              background: "#22c55e",
            }}
          />
          Azhar Mahmud Alif
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 32,
            maxWidth: 900,
          }}
        >
          Automate Anything
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 500,
            color: "#a1a1aa",
            marginTop: 16,
          }}
        >
          AI Automation Specialist
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: 26,
          color: "#71717a",
        }}
      >
        <span>AI agents · n8n workflows · API integrations</span>
        <span style={{ color: "#22c55e" }}>itsazhar.com</span>
      </div>
    </div>,
    { ...size },
  );
}
