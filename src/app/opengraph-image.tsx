import { ImageResponse } from "next/og";

export const alt = "One Pixel Off — One detail is wrong";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const tiles = Array.from({ length: 25 }, (_, index) => index);

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "64px 70px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#090C11",
          color: "#F2EFE5",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ width: 620, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", color: "#C8FF38", fontSize: 22, fontWeight: 800, letterSpacing: 4 }}>
            VISUAL INSPECTION / 15 SEC
          </div>
          <div style={{ marginTop: 24, display: "flex", fontSize: 92, fontWeight: 900, lineHeight: 0.9, letterSpacing: -7 }}>
            ONE PIXEL OFF
          </div>
          <div style={{ marginTop: 28, display: "flex", color: "#AAB1BD", fontSize: 29 }}>
            One detail is wrong. Can you see it?
          </div>
        </div>
        <div
          style={{
            width: 420,
            height: 420,
            padding: 22,
            display: "flex",
            flexWrap: "wrap",
            background: "#F2EFE5",
            border: "5px solid #F2EFE5",
            boxShadow: "14px 14px 0 #222B37",
          }}
        >
          {tiles.map((index) => {
            const target = index === 18;
            return (
              <div
                key={index}
                style={{
                  width: "20%",
                  height: "20%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0D1016",
                  background: "#FFFDF5",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    borderRadius: 99,
                    background: "#0D1016",
                    border: "0 solid transparent",
                    marginLeft: target ? 7 : 0,
                    marginTop: target ? -5 : 0,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    ),
    size,
  );
}
