import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: '../src-tauri/dist',
      assets: '../src-tauri/dist',
      fallback: 'index.html',
      precompress: false,
      strict: false
    }),
    prerender: {
      entries: ['*'],
      handleMissingId: 'ignore',
      handleHttpError: ({ path, message }) => {
        console.warn(`Prerender warning for ${path}: ${message}`);
        return 'ignore';
      }
    }
  }
};
