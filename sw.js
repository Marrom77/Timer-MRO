(function () {
  "use strict";

  var CACHE = "timer-mro-v3";
  var ASSETS = [
    "./",
    "./index.html",
    "./Timer-MRO.html",
    "./manifest.webmanifest",
    "./icons/apple-touch-icon.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
  ];

  self.addEventListener("install", function (event) {
    event.waitUntil(
      caches.open(CACHE).then(function (cache) {
        return cache.addAll(ASSETS);
      }).then(function () {
        return self.skipWaiting();
      })
    );
  });

  self.addEventListener("activate", function (event) {
    event.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (k) {
          return k !== CACHE;
        }).map(function (k) {
          return caches.delete(k);
        }));
      }).then(function () {
        return self.clients.claim();
      })
    );
  });

  // Cache-first: alles aus dem Cache, nur Unbekanntes aus dem Netz
  self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") { return; }
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(function (hit) {
        if (hit) { return hit; }
        return fetch(event.request).catch(function () {
          if (event.request.mode === "navigate") {
            return caches.match("./Timer-MRO.html");
          }
          return Response.error();
        });
      })
    );
  });
})();
