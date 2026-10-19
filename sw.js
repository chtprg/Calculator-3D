'use strict';
// Guarda o app no celular para abrir sem internet.
// Ao mudar qualquer arquivo, suba a VERSAO para o celular buscar a nova.
const VERSAO = 'caderninho-1.0.0';
const ARQUIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/fatura.js', 'js/bancos.js', 'js/dados.js', 'js/desenho.js', 'js/app.js',
  'fonts/caveat-700.woff2', 'fonts/alegreya-sans-latin-400-normal.woff2', 'fonts/alegreya-sans-latin-400-italic.woff2',
  'fonts/alegreya-sans-latin-700-normal.woff2', 'fonts/cinzel-latin-700-normal.woff2',
  'icones/icone-192.png', 'icones/icone-512.png',
  ...['nubank', 'bb', 'itau', 'bradesco', 'santander', 'caixa', 'inter', 'c6', 'mercadopago', 'picpay', 'neon',
    'pagbank', 'sicoob', 'sicredi', 'pan', 'bnb', 'xp', 'btg', 'original', 'banrisul'].map(b => `logos/${b}.svg`),
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// primeiro o que está guardado; se não tiver, busca e guarda
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(guardado => guardado || fetch(req).then(resp => {
      if (resp.ok) { const copia = resp.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return resp;
    }).catch(() => req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
  );
});
