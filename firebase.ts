import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANDlWJAY5l7E9iL6BYWyP1GsTwx7N1rAk",
  authDomain: "fitlink-a12fd.firebaseapp.com",
  projectId: "fitlink-a12fd",
  storageBucket: "fitlink-a12fd.appspot.com",
  messagingSenderId: "522346151722",
  appId: "1:522346151722:web:0e59c8ac77bdb3255ee853",
  measurementId: "G-NL2QHT015H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
