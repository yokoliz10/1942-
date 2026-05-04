self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

self.addEventListener('fetch', (e) => {
    // 军师军令：彻底废除缓存机制，保证主公每次看到的都是最新版！
    e.respondWith(
        fetch(e.request, { cache: 'no-store' }).catch(() => new Response('Network Error'))
    );
});
