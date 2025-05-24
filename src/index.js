console.log("Webpack is working")

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend, Title } from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title)

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

console.log("Firebase initialized")

const db = getFirestore();

console.log("Firestore initialized")

const colRef = collection(db, "website-times")

console.log("Collection reference created")

onSnapshot(colRef, (snapshot) => {
  console.log("Snapshot received")
  let websites = []; 
  const websiteTimeDict = {}
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const name = data.websiteName
      const time = data.activeMins || 0; 
      if (websiteTimeDict[name]) {
        websiteTimeDict[name] += time
      } else {
        websiteTimeDict[name] = time
      }
      websites.push({ ...doc.data(), id: doc.id })
    })
    console.log(websites)
    console.log(websiteTimeDict)

    const chartData = []
    for (const [key, value] of Object.entries(websiteTimeDict)) {
      chartData.push({ name: key, count: value });
    }

      const ctx = document.getElementById('acquisitions').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: chartData.map(row => row.name),
          datasets: [{
            label: 'Minutes',
            data: chartData.map(row => row.count),
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
              '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384'
            ],
          }]
        },
        options: {
          responsive: true,
        }
      })
    })