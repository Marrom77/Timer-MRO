(function () {
  "use strict";

  var CACHE = "timer-mro-v18";
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

  // Seiten: zuerst Netz (Updates sofort sichtbar), offline aus dem Cache
  function networkFirst(request) {
    return fetch(request, { cache: "no-store" }).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(request, { ignoreSearch: true }).then(function (hit) {
        return hit || caches.match("./Timer-MRO.html");
      });
    });
  }

  // Übrige Dateien: Cache-first, nur Unbekanntes aus dem Netz
  self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") { return; }
    var url = new URL(event.request.url);
    if (event.request.mode === "navigate" || /\.html$/.test(url.pathname) || /\/$/.test(url.pathname)) {
      event.respondWith(networkFirst(event.request));
      return;
    }
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
