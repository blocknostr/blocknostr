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
    },
    // Add explicit extensions to help resolving
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-components': ['@/components/ui/button', '@/components/ui/dialog', '@/components/ui/sheet'],
          'nostr-core': ['@/lib/nostr/index', '@/lib/nostr/social', '@/lib/nostr/service'],
          'chat-components': ['@/components/chat/WorldChat', '@/components/chat/hooks/useWorldChat']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'pixi.js',
      '@pixi/assets',
      '@pixi/sprite-animated',
      '@pixi/particle-emitter',
      '@pixi/sound'
    ]
  }
}));
