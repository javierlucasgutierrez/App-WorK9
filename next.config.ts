import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oculta el botón de desarrollo de Next.js (tapaba la barra de navegación en el móvil).
  devIndicators: false,
  experimental: {
    // Permite subir varias fotos a la vez desde los formularios.
    serverActions: { bodySizeLimit: "70mb" },
  },
};

export default nextConfig;
