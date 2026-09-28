import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Logesh Kumar, Software Development Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const layers = ["Client", "API", "Async", "Data"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#0a0b0d",
          color: "#ecebe6",
          backgroundImage:
            "linear-gradient(to bottom, rgba(236,235,230,0.05) 1px, transparent 1px), linear-gradient(to right, rgba(236,235,230,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#92959d", letterSpacing: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#dea45a" }} />
          SOFTWARE DEVELOPMENT ENGINEER
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -6, lineHeight: 0.9 }}>LOGESH KUMAR</div>
          <div style={{ fontSize: 44, marginTop: 28, display: "flex" }}>
            Engineering products from<span style={{ color: "#dea45a", marginLeft: 14 }}>ideas</span>.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 24, color: "#8a7c69" }}>
          {layers.map((l, i) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ border: "1px solid rgba(138,124,105,0.6)", borderRadius: 10, padding: "10px 18px" }}>{l}</div>
              {i < layers.length - 1 && <div style={{ width: 48, height: 2, background: "#dea45a" }} />}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
