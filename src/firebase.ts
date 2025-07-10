// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBti79WCpkH3RNZWxkiC8zR3aUFf2wdfso",
  authDomain: "auth-1fa0a.firebaseapp.com",
  projectId: "auth-1fa0a",
  storageBucket: "auth-1fa0a.firebasestorage.app",
  messagingSenderId: "470951034832",
  appId: "1:470951034832:web:fdace6a532df4b33bb83d5",
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
