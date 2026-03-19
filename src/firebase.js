// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCKAC8Jh5y8khVw3rSiUvZva9C7CqLsLA",
  authDomain: "testecnico-6e150.firebaseapp.com",
  projectId: "testecnico-6e150",
  storageBucket: "testecnico-6e150.firebasestorage.app",
  messagingSenderId: "903912027193",
  appId: "1:903912027193:web:e7a0129f086115aa0849e8",
  measurementId: "G-9181LP4KYM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { app, analytics, storage, db };
