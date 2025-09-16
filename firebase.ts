// FIX: Updated Firebase imports to use v9 compat libraries to resolve property errors.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyANDlWJAY5l7E9iL6BYWyP1GsTwx7N1rAk",
  authDomain: "fitlink-a12fd.firebaseapp.com",
  projectId: "fitlink-a12fd",
  // FIX: Updated storageBucket to the correct address to resolve CORS issue.
  storageBucket: "fitlink-a12fd.firebasestorage.app",
  messagingSenderId: "522346151722",
  appId: "1:522346151722:web:0e59c8ac77bdb3255ee853",
  measurementId: "G-NL2QHT015H"
};

// Initialize Firebase
// FIX: Use v8 initialization, guarded to prevent re-initialization.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();


export { auth, db, storage };