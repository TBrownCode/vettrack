/* eslint-disable no-restricted-globals */

// This service worker can be customized
self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    self.clients.claim();
  });
  
  // Fetch is required to enable serving when offline
  self.addEventListener('fetch', (event) => {
    // For now, we'll just add a simple fetch listener
    event.respondWith(fetch(event.request));
  });