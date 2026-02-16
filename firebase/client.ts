import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC-UonKcae3xQYeiHLKiP064oQoz9frlmM",
    authDomain: "prepwise-2cbb3.firebaseapp.com",
    projectId: "prepwise-2cbb3",
    storageBucket: "prepwise-2cbb3.firebasestorage.app",
    messagingSenderId: "796443961448",
    appId: "1:796443961448:web:7232c2ff844541182033dd",
    measurementId: "G-M1PDBYN4DL"
};

const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);