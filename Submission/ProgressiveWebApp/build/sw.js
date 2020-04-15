/*
Copyright 2018 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.5.0/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
  workbox.precaching.precacheAndRoute([
  {
    "url": "style/main.css",
    "revision": "d7bd2db32f65ae392e162218a4837e6b"
  },
  {
    "url": "index.html",
    "revision": "fdb6a8465b98805ab3b807c8b0adcc9f"
  },
  {
    "url": "js/idb-promised.js",
    "revision": "8fb5c9b2f422347fb1a54827f2ff40a6"
  },
  {
    "url": "js/moment.js",
    "revision": "761502841c035afcf6a9bdc5d0a20d11"
  },
  {
    "url": "js/main.js",
    "revision": "f80c144a0c3ea18af139807f01875b1f"
  },
  {
    "url": "images/profile/cat.jpg",
    "revision": "69936d25849a358d314f2f82e9fa4578"
  },
  {
    "url": "images/profile/dog.png",
    "revision": "88a859d2caaa5ae69378fd8beeadc198"
  },
  {
    "url": "images/profile/kid.png",
    "revision": "f5852ed4dda56799d24f1de2e2f51cf2"
  },
  {
    "url": "images/touch/aids-128x128.png",
    "revision": "f880a60afdde5741274de1decee4fbe5"
  },
  {
    "url": "images/touch/aids-256x256.png",
    "revision": "fd4aba40ab04e12e67cdbd116bb0f14b"
  },
  {
    "url": "images/touch/aids-512x512.png",
    "revision": "0fb76ff4af13565636f3e08740132637"
  },
  {
    "url": "manifest.json",
    "revision": "13fb1945c507952e52acf09595b50d13"
  }
]);

  const showNotification = () => {
    self.registration.showNotification('Background sync success!', {
      body: '🎉`🎉`🎉`'
    });
  };

  const bgSyncPlugin = new workbox.backgroundSync.Plugin(
    'dashboardr-queue',
    {
      callbacks: {
        queueDidReplay: showNotification
        // other types of callbacks could go here
      }
    }
  );

  const networkWithBackgroundSync = new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin],
  });

  workbox.routing.registerRoute(
      /\/hapiR4\/baseR4/,
    // /\/api\/add/,
    networkWithBackgroundSync,
    'POST'
  );

} else {
  console.log(`Boo! Workbox didn't load 😬`);
}
