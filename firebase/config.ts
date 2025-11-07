import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyBkZW1PkujJhb1EzKtR8KM5PRh88BZp0RI",
  authDomain: "cantina-icone.firebaseapp.com",
  databaseURL: "https://cantina-icone-default-rtdb.firebaseio.com",
  projectId: "cantina-icone",
  storageBucket: "cantina-icone.appspot.com",
  messagingSenderId: "206547683119",
  appId: "1:206547683119:web:30d66cdd467e97eb2643da",
  measurementId: "G-10SRT3H1SE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const db = getDatabase(app);
export const firestore = getFirestore(app);
