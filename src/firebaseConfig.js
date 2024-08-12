import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjZUEDkt_Ylig_uFPGTNqy57_kKWOMKvM",
  authDomain: "booking-bangladesh.firebaseapp.com",
  projectId: "booking-bangladesh",
  storageBucket: "booking-bangladesh.appspot.com",
  messagingSenderId: "999211561734",
  appId: "1:999211561734:web:2db8cf2fd3e8819de26487",
  measurementId: "G-6HSPYJ7MWX",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;
