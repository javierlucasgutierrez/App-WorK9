import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite subir vídeos desde los formularios (hasta 200 MB).
    serverActions: { bodySizeLimit: "200mb" },
  },
};

export default nextConfig;
