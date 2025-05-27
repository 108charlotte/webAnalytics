import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, onSnapshot, collection, query, where, addDoc, updateDoc, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore'

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

const db = getFirestore()
const colRef = collection(db, "website-times")

export async function clearCollection(collectionName) {
  const colRef = collection(db, collectionName)
  const snapshot = await getDocs(colRef)
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, docSnap.id))
  }
  console.log(`Cleared collection: ${collectionName}`)
}

// --- Promise-based retrieveUserId ---
function getRandomToken() {
  var randomPool = new Uint8Array(32)
  crypto.getRandomValues(randomPool)
  var hex = ''
  for (var i = 0; i < randomPool.length; ++i) {
    hex += randomPool[i].toString(16)
  }
  return hex
}

export function retrieveUserId() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('userid', function(items) {
      let userId
      if (items.userid) {
        userId = items.userid
        console.log('Using existing user ID:', userId)
      } else {
        userId = getRandomToken()
        chrome.storage.sync.set({userid: userId}, function() {
          console.log('Generated new userId:', userId)
        })
      }
      resolve(userId)
    })
  })
}

export function newTabToFirestore(data) {
  addDoc(colRef, {
    websiteName: data.websiteName,
    setActive: new Date(data.timestamp),
    setIdle: null, 
    tabId: data.tabId, 
    userId: data.userId
  })
}

export function onWebsiteTimesUpdated(userId, callback) {
  onSnapshot(colRef, (snapshot) => {
    console.log("Snapshot received")
    let websites = []
    const websiteTimeDict = {}

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.userId == userId) {
        const name = data.websiteName
        let startDate = data.setActive.toDate()
        let endDate = data.setIdle?.toDate()
        if (endDate && startDate && endDate > startDate) {
          let durationInMinutes = Math.round((endDate - startDate) / 1000 / 60)
          websiteTimeDict[name] = (websiteTimeDict[name] || 0) + durationInMinutes
        }
        websites.push({ ...data, id: doc.id })
      }
    })

    console.log(websites)
    console.log(websiteTimeDict)
    callback(websiteTimeDict, websites)
  })
}

export function endAllSessions() {
  const openSessionsQuery = query(colRef, where("setIdle", "==", null))
  getDocs(openSessionsQuery).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const docRef = doc(db, "website-times", doc.id)
      updateDoc(docRef, {
        setIdle: new Date()
      }).then(() => {
        console.log("Updated entry with website name:", doc.data().websiteName)
      }).catch((error) => {
        console.error("Error updating document:", error)
      })
    })
  }).catch((error) => {
    console.error("Error getting documents:", error)
  })
}

export async function updateTabToFirestore(data) {
  try {
    console.log("Trying to update:", data.websiteName, data.tabId, data.setIdle);
    if (!data.websiteName) {
      console.log("User switched to a non-chrome tab or tab with no websiteName.")
      return
    }
    const nearestIncompleteEntryWithSameName = query(
      colRef,
      where("websiteName", "==", data.websiteName),
      where("tabId", "==", data.tabId),
      where("setIdle", "==", null),
      orderBy("setActive", "desc"),
      limit(1)
    )
    const querySnapshot = await getDocs(nearestIncompleteEntryWithSameName)
    console.log("Query found", querySnapshot.size, "docs");
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