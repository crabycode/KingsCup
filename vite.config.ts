import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = repository && repository !== `${process.env.GITHUB_REPOSITORY?.split('/')[0]}.github.io`
  ? `/${repository}/`
  : '/';

function pagesPwa(): Plugin {
  return {
    name: 'github-pages-pwa',
    generateBundle(_options, bundle) {
      const generatedAssets = Object.keys(bundle)
        .filter((file) => file !== 'sw.js' && /^(index\.html|.*\.(js|css|ico|png|svg|webmanifest))$/.test(file))
        .map((file) => `${base}${file}`);
      const urls = [...new Set([
        ...generatedAssets,
        `${base}index.html`,
        `${base}manifest.webmanifest`,
        `${base}favicon.svg`,
        `${base}icons/icon-192.png`,
        `${base}icons/icon-512.png`,
      ])];
      const worker = `const CACHE = 'kings-cup-${Date.now()}';\nconst BASE = ${JSON.stringify(base)};\nconst FILES = ${JSON.stringify(urls)};\nself.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));\nself.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('kings-cup-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));\nself.addEventListener('fetch', event => { const request = event.request; const url = new URL(request.url); if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return; if (request.mode === 'navigate') { event.respondWith(fetch(request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); return response; }).catch(async () => (await caches.match(request)) || (await caches.match(BASE + 'index.html')))); return; } event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => { if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); } return response; }))); });\n`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: worker });
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), pagesPwa()],
});
