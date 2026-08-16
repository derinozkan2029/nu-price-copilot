import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "#FAF6ED",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: "#1B1812",
              color: "#FAF6ED",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            N
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              fontSize: 34,
              color: "#1B1812",
            }}
          >
            <span style={{ display: "flex" }}>NU Price</span>
            <span style={{ display: "flex", color: "#4E2A84" }}>Copilot</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 58,
            lineHeight: 1.15,
            color: "#1B1812",
            maxWidth: 950,
          }}
        >
          Stop overpaying on the same purchases, every semester.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 44,
            gap: 28,
            fontSize: 20,
            color: "#726A59",
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          <div style={{ display: "flex" }}>Built for Northwestern</div>
          <div style={{ display: "flex" }}>Evanston, IL</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
