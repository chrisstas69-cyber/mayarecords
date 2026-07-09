import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes the Label Portal installable as an app.
 * On iPhone: open /admin in Safari → Share → "Add to Home Screen".
 * On desktop Chrome: install icon in the address bar.
 * The installed app launches straight into /admin, full-screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maya Records — Label Portal",
    short_name: "Maya Portal",
    description: "Upload releases, mixes and merch. Manage the Maya Records catalog.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0a08",
    theme_color: "#0b0a08",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
