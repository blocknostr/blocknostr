import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    headers: {
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Performance headers
      'Cache-Control': mode === 'development' ? 'no-cache' : 'public, max-age=31536000, immutable',
    },
    // Add proxy configuration for CORS-restricted services during development
    proxy: mode === 'development' ? {
      // ✅ CoinGecko API proxy to resolve CORS issues
      '/api/coingecko': {
        target: 'https://api.coingecko.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coingecko/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[Vite Proxy] CoinGecko proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[Vite Proxy] CoinGecko request: ${req.method} ${req.url}`);
          });
        }
      },
      '/api/ipfs': {
        target: 'https://ipfs.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ipfs/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[Vite Proxy] IPFS proxy error:', err.message);
          });
        }
      },
      '/api/arweave': {
        target: 'https://arweave.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/arweave/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[Vite Proxy] Arweave proxy error:', err.message);
          });
        }
      }
    } : {}
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
          'nostr-core': ['@/lib/nostr/index', '@/lib/nostr/social', '@/lib/nostr/core-service'],
          'chat-components': ['@/components/chat/WorldChat', '@/components/chat/hooks/useWorldChatRedux']
        }
      }
    }
  }
}));

