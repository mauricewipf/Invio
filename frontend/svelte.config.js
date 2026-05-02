import nodeAdapter from "@sveltejs/adapter-node";
import staticAdapter from '@sveltejs/adapter-static';

const isDesktop = process.env.DESKTOP_BUILD === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: isDesktop
      ? staticAdapter({
          pages: '../src-tauri/dist',
          assets: '../src-tauri/dist',
          fallback: 'index.html',
          precompress: false,
          strict: false
        })
      : nodeAdapter({
          out: "build",
        }),
    paths: {
      relative: isDesktop,
    },
  },
  vitePlugin: {
    dynamicCompileOptions: ({ filename }) =>
      filename.includes("node_modules") ? undefined : { runes: true },
  },
};

export default config;
