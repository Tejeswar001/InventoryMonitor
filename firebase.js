// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsu4I4gt1jZJCzFyatmVRl2ok132iSfho",
  authDomain: "inventory-management-bf186.firebaseapp.com",
  projectId: "inventory-management-bf186",
  storageBucket: "inventory-management-bf186.appspot.com",
  messagingSenderId: "736785403433",
  appId: "1:736785403433:web:0396e2cad1dfcab4949638",
  measurementId: "G-6TMW0N5DCF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Initialize Analytics only in the browser
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(error => {
    console.error('Analytics is not supported:', error);
  });
}

export { firestore, storage, auth, analytics };
