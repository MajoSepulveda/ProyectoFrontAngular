import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA_tIDkBezGEVRk4J-IJ7A4rlMTccFk3AU",
  authDomain: "frontend-angular-712c4.firebaseapp.com",
  projectId: "frontend-angular-712c4",
  storageBucket: "frontend-angular-712c4.firebasestorage.app",
  messagingSenderId: "746415150186",
  appId: "1:746415150186:web:3ad13f8e7c01eb162a6613",
  measurementId: "G-K25FGEDNDY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
