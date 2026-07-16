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
    categories: ["games", "entertainment", "puzzle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
