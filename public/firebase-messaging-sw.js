importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCq31RhKn5vFUhqM53lSf3zm0xp8oJSLQk",
    authDomain: "ideayaan-cd964.firebaseapp.com",
    projectId: "ideayaan-cd964",
    storageBucket: "ideayaan-cd964.firebasestorage.app",
    messagingSenderId: "686662832453",
    appId: "1:686662832453:web:cceaafd8dd508de564ee2c",
    measurementId: "G-JJVGWKP9FV"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/android-chrome-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event);
    event.notification.close();

    // Custom redirection logic
    const clickAction = event.notification.data?.click_action || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(clickAction) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(clickAction);
            }
        })
    );
});
