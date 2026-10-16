import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCSbR4h0L-wB2dIS7Z5RuzTn9v1wfq51Q",
  authDomain: "badbeaow.firebaseapp.com",
  databaseURL: "https://badbeaow-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "badbeaow",
  storageBucket: "badbeaow.firebasestorage.app",
  messagingSenderId: "1084223380159",
  appId: "1:1084223380159:web:ce648eb62992e59eb6040a",
  measurementId: "G-4FGWG5VME1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app, "https://badbeaow-default-rtdb.asia-southeast1.firebasedatabase.app");
