import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // @ts-ignore - buildActivity is supported in Next.js 15/16 runtime
    buildActivity: false,
    // @ts-ignore - appIsrStatus is supported in Next.js 15/16 runtime to hide the 'N' indicator
    appIsrStatus: false,
  },
};

export default nextConfig;
