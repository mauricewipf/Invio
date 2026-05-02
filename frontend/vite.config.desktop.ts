import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_DESKTOP_BUILD': JSON.stringify('true')
  },
  plugins: [tailwindcss(), sveltekit()]
});
