import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oculta el botón de desarrollo de Next.js (tapaba la barra de navegación en el móvil).
  devIndicators: false,
  experimental: {
    // Permite subir varias fotos a la vez desde los formularios.
    serverActions: { bodySizeLimit: "70mb" },
  },
  // En modo desarrollo, no vigilar la base de datos, las fotos ni los correos de prueba:
  // si no, cada vez que se guardan datos la página se recargaba a medias.
  webpack(config, { dev }) {
    if (dev) {
      const ignored = ["**/node_modules/**", "**/.git/**", "**/prisma/*.db*", "**/uploads/**", "**/correos/**"];
      config.watchOptions = { ...config.watchOptions, ignored };
    }
    return config;
  },
};

export default nextConfig;
