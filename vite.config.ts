import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api-wilayah': {
        target: 'https://wilayah.id/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-wilayah/, '')
      }
    }
  },
  build: {
    target: 'es2020', // ensure modern semantics for large libs like @aws-sdk
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000, // Increase warning limit for heavy libraries like excel-lib
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          let extType = ext;
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            extType = 'img';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        // Manual chunks untuk memisahkan vendor libraries
        manualChunks(id) {
          // Node modules chunking
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            
            // Firebase - use dynamic approach to avoid resolution issues
            if (id.includes('firebase')) {
              return 'firebase';
            }
            
            // UI Libraries
            if (id.includes('@headlessui') || 
                id.includes('@heroicons') || 
                id.includes('framer-motion') ||
                id.includes('react-hot-toast') ||
                id.includes('react-intersection-observer') ||
                id.includes('react-responsive')) {
              return 'ui-libs';
            }
            
            // Document processing libraries - split into smaller chunks
            if (id.includes('exceljs')) {
              return 'excel-lib';
            }
            if (id.includes('pdf-lib')) {
              return 'pdf-lib';
            }
            if (id.includes('react-pdf')) {
              return 'react-pdf';
            }
            if (id.includes('file-saver') || id.includes('browser-image-compression')) {
              return 'file-utils';
            }
            
            // Other vendor libraries
            if (id.includes('classnames')) {
              return 'utils';
            }
            
            // Large vendor libraries that should be separate
            return 'vendor';
          }
        },
      },
    },
  },
})
