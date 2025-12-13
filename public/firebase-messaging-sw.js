importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

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
