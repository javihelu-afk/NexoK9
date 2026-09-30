import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCfGfg9UrM5JTP5DHtKxYIsC5z8azBx9GI",
  authDomain: "nexok9.firebaseapp.com",
  projectId: "nexok9",
  storageBucket: "nexok9.firebasestorage.app",
  messagingSenderId: "75441712782",
  appId: "1:75441712782:web:b58943a9b355a30fcde3df",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);