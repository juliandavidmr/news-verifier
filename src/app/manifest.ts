import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "News Verifier",
    short_name: "Verifier",
    description:
      "Check factual claims in public links and screenshots against traceable evidence.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efdf",
    theme_color: "#f4efdf",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
