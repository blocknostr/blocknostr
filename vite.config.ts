
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add Next.js compatibility aliases
      "next/font/google": path.resolve(__dirname, "./src/lib/next-shims/font.js"),
      "next/navigation": path.resolve(__dirname, "./src/lib/next-app-router-shim.tsx"),
      "next/link": path.resolve(__dirname, "./src/components/Link.tsx"),
      "next/image": path.resolve(__dirname, "./src/lib/next-compat.tsx"),
    },
  },
  define: {
    // Define process.env for Next.js components
    "process.env": {
      NODE_ENV: JSON.stringify(mode),
      __NEXT_ROUTER_BASEPATH: JSON.stringify(""),
      __NEXT_SCROLL_RESTORATION: false,
      __NEXT_HAS_REWRITES: false,
      __NEXT_I18N_SUPPORT: false,
      NEXT_PUBLIC_DEFAULT_RELAYS: JSON.stringify(process.env.VITE_DEFAULT_RELAYS || ''),
      NEXT_PUBLIC_API_URL: JSON.stringify(process.env.VITE_API_URL || ''),
      NEXT_PUBLIC_ENVIRONMENT: JSON.stringify(mode),
    },
  },
}));
