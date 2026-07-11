import { ImageResponse } from "next/og";

// Site-wide default social card (1200×630). Inherited by any page that does
// not provide its own image. Uses Latin text so it renders with the built-in
// font without bundling a Persian webfont.
export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "bartar-repairer.com — Electronics Repair, Tehran";

export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #13161C 0%, #2a0d0d 60%, #B3170F 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: 30,
            fontWeight: 700,
            color: "#E0473F",
            letterSpacing: "0.04em",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: "#DA251C",
              boxShadow: "0 0 24px #DA251C",
            }}
          />
          BARTAR REPAIR CENTER
        </div>
        <div style={{ marginTop: 28, fontSize: 76, fontWeight: 800, lineHeight: 1.1 }}>
          Electronics Repair
        </div>
        <div style={{ marginTop: 8, fontSize: 50, fontWeight: 700, color: "#E7E7E7" }}>
          Mobile · Laptop · Tablet · TV
        </div>
        <div style={{ marginTop: 40, fontSize: 34, color: "#BDBDBD" }}>
          Tehran · 6-month warranty · Original parts
        </div>
        <div style={{ marginTop: 18, fontSize: 34, fontWeight: 700, color: "#ffffff" }}>
          bartar-repairer.com
        </div>
      </div>
    ),
    { ...size },
  );
}
