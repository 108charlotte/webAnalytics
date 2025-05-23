import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-e_UcwoG3M3cA_3owudIPIgSyzoHNICA",
  authDomain: "time-tracker-5dae5.firebaseapp.com",
  projectId: "time-tracker-5dae5",
  storageBucket: "time-tracker-5dae5.firebasestorage.app",
  messagingSenderId: "478476863536",
  appId: "1:478476863536:web:f19239a443267011b405f5",
  measurementId: "G-2883329C3P"
};

console.log("Script loaded")

initializeApp(firebaseConfig);

const db = getFirestore();

const colRef = collection(db, "website-times"); 

getDocs(colRef)
  .then((snapshot) => {
    if (snapshot.empty) {
      console.log("No matching documents.");
    } else {
      snapshot.docs.forEach((doc) => {
        console.log(doc.id, "=>", doc.data());
      });
    }
  })
  .catch((err) => {
    console.log("Error getting documents:", err.message)
  })