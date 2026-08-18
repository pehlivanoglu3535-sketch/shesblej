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
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
    // Keep optimized copies at the edge for a month so a popular listing
    // costs Supabase one fetch, not one per visitor.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
