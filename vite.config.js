import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' makes every file path relative, so the built site works
// on GitHub Pages (username.github.io/crinkletales/) and in previews.
export default defineConfig({
  plugins: [react()],
  base: './',
});
