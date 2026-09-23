import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Pin the project root (a stray ~/package-lock.json otherwise confuses file tracing).
  outputFileTracingRoot: __dirname,
  // Gated files read from disk at request time; tracing can't see them via imports.
  outputFileTracingIncludes: {
    "/api/epk/[file]": ["./private/epk/**"],
  },
  images: {
    // The seed catalog ships SVG sleeve placeholders; sandboxed, no scripts.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
