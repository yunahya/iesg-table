import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The playground imports the library from source, so edits to src/ hot-reload.
export default defineConfig({
  root: 'playground',
  plugins: [react(), tailwindcss()],
  server: { port: 5273 },
});
