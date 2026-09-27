import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    // Listing photos live in Supabase Storage. Serving them through Next's
    // optimizer means Vercel fetches each original once, then serves resized
    // WebP from its own CDN — without this, every card render pulled the full
    // upload straight from Supabase and burned the 5 GB/month egress quota.
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
      // Encar export listings (official partner inventory) are served from
      // Encar's own image CDN rather than re-uploaded to our storage.
      { protocol: "https" as const, hostname: "ci.encar.com", pathname: "/carpicture/**" },
      // Auto Salloni Alberti (partner inventory). Their photos stay on their
      // own CDN rather than being copied here: this store is meant to track
      // their stock, so a picture they replace should change here too. The
      // RE/MAX import went the other way — those listings were a one-off
      // snapshot, and surviving a deletion on their side was worth more.
      { protocol: "https" as const, hostname: "autosallonialberti.net", pathname: "/assets/inventory/**" },
    ],
    // Keep optimized copies at the edge for a month so a popular listing
    // costs Supabase one fetch, not one per visitor.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
