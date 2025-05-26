import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, onSnapshot, collection, query, where, addDoc, updateDoc, QuerySnapshot, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyC-e_UcwoG3M3cA_3owudIPIgSyzoHNICA",
  authDomain: "time-tracker-5dae5.firebaseapp.com",
  projectId: "time-tracker-5dae5",
  storageBucket: "time-tracker-5dae5.firebasestorage.app",
  messagingSenderId: "478476863536",
  appId: "1:478476863536:web:f19239a443267011b405f5",
  measurementId: "G-2883329C3P"
}

initializeApp(firebaseConfig);

console.log("Firebase initialized")

const db = getFirestore()

console.log("Firestore initialized")

const colRef = collection(db, "website-times")

console.log("Collection reference created")

/*
clearCollection("website-times").then(() => {
  console.log("❗️ Collection cleared")
})
  */

let websites = []; 
const websiteTimeDict = {}

// see resources for where I got this from (stack overflow)
function onToday(date) {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
}

async function clearCollection(collectionName) {
  const colRef = collection(db, collectionName)
  const snapshot = await getDocs(colRef)
  
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, docSnap.id))
  }

  console.log(`Cleared collection: ${collectionName}`)
}

export function onWebsiteTimesUpdated(callback) {
  onSnapshot(colRef, (snapshot) => {
    console.log("Snapshot received")
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const name = data.websiteName
        let startDate = data.setActive.toDate()
        let today = new Date()
        if (onToday(startDate)) {
          let endDate = data.setIdle?.toDate()
          if (endDate && startDate && endDate > startDate) {
            let durationInMinutes = Math.round((endDate - startDate) / 1000 / 60)
            websiteTimeDict[name] = (websiteTimeDict[name] || 0) + durationInMinutes
          }
          websites.push({ ...doc.data(), id: doc.id })
      }
    })
    console.log(websites)
    console.log(websiteTimeDict)
    callback(websiteTimeDict)
  })
}

export function newTabToFirestore(data) {
  addDoc(colRef, {
    websiteName: data.websiteName,
    setActive: new Date(data.timestamp),
    setIdle: null
  })
}

export async function updateTabToFirestore(data) {
  try {
    if (!data.websiteName) {
      console.log("User switched to a non-chrome tab or tab with no websiteName.");
      return;
    }
    const nearestIncompleteEntryWithSameName = query(colRef, where("websiteName", "==", data.websiteName), where("setIdle", "==", null), orderBy("setActive", "desc"), limit(1))
    const querySnapshot = await getDocs(nearestIncompleteEntryWithSameName)
    if (!querySnapshot.empty) {
      const docToUpdate = querySnapshot.docs[0]
      const docRef = doc(db, "website-times", docToUpdate.id)
      console.log("Found an entry to update with website name:", docToUpdate.data().websiteName)
      await updateDoc(docRef, {
        setIdle: data.setIdle
      })
      console.log("Updated entry with website name:", docToUpdate.data().websiteName)
    }
  } catch (error) {
    if (error.message && error.message.includes("Function where() called with invalid data")) {
      console.log("User switched to a non-chrome tab or tab with no websiteName")
    }
  }
}