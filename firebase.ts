// Firebase v8 compat imports
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDlyq-ytBnKLkSVFJq4Qkrr751VSIFXrGg",
  authDomain: "texconnect-16675.firebaseapp.com",
  projectId: "texconnect-16675",
  storageBucket: "texconnect-16675.appspot.com",
  messagingSenderId: "701763840860",
  appId: "1:701763840860:web:61dd8b5eb0c32ef81daf99",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firestore with modern cache settings
const db = firebase.firestore();

// Configure Firestore settings with modern cache approach
// This replaces the deprecated enablePersistence() methods
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  merge: true, // Prevents override warning
});


export const auth = firebase.auth();
export const storage = firebase.storage();
export { db, firebase };