const CACHE_NAME = "attendance-app-v2"

const urlsToCache = [
"/",
"/index.html",
"/teacher.html",
"/admin.html",
"/style.css",
"/app.js",
"/admin.js",
"/firebase.js",
"/login.js"
]

self.addEventListener("install",event=>{
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache=>cache.addAll(urlsToCache))
)
})

self.addEventListener("fetch",event=>{
event.respondWith(
caches.match(event.request)
.then(response=>response || fetch(event.request))
)
})