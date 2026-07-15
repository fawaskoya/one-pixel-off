import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "One Pixel Off",
    short_name: "Pixel Off",
    description:
      "Find the single altered tile in escalating code-generated visual puzzles.",
    start_url: "/focus",
    display: "standalone",
    background_color: "#090C11",
    theme_color: "#090C11",
    orientation: "portrait-primary",
    categories: ["games", "entertainment", "puzzle"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
