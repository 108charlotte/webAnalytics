import { newTabToFirestore, updateTabToFirestore } from "./firestore"

console.log('chrome.idle:', chrome.idle)

chrome.idle.setDetectionInterval(60)

let lastActiveTab = null
let lastActiveTabTimestamp = null
let lastWindowId = null

// Error: Error handling response: TypeError: Cannot read properties of undefined (reading 'replace')
    // at addOldTabToFirestore (chrome-extension://jiohkpcpmhajmafdfcjnpjohigdaefjl/dist/background.bundle.js:27933:47)
    // at chrome-extension://jiohkpcpmhajmafdfcjnpjohigdaefjl/dist/background.bundle.js:27990:11Understand this error
function addOldTabToFirestore(message) {
    if (lastActiveTab && lastActiveTab.url) {
        let hostname; 
        try {
            hostname = new URL(lastActiveTab.url).hostname.replace('www.', '')
        } catch (e) {
            console.warn('Error parsing URL:', lastActiveTab.url, e)
            return
        }
        const lastData = {
            websiteName: hostname,
            endDate: Date.now(),
        }
        updateTabToFirestore(lastData)
        console.log(message, lastActiveTab)
    }
}

// when the user becomes active, get the newly active tab and export to firebase with start time at that time
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        const url = new URL(tab.url)
        const websiteName = url.hostname.replace('www.', '')
        const data = {
            websiteName,
            timestamp: Date.now(),
        }
        newTabToFirestore(data)

        // update the last active tab
        addOldTabToFirestore('Updated last active tab before switching to new one: ')

        lastActiveTab = tab
        lastActiveTabTimestamp = Date.now()
        lastWindowId = tab.windowId
        console.log('Active tab updated:', lastActiveTab)
    })
})

// when the user becomes idle or switches windows, update the end date of the firebase entry for the last active tab (need to store somewhere)
chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === 'idle' || newState === 'locked') {
        addOldTabToFirestore('User is idle, updating last active tab: ')
    }
})

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // User has switched to a different window or minimized the current one
        if (lastActiveTab) {
            const lastTabUrl = new URL(lastActiveTab.url)
            const data = {
                websiteName: lastTabUrl.hostname.replace('www.', ''),
                endDate: Date.now(),
            }
            updateTabToFirestore(data)
            console.log('Window focus changed, updated tab:', lastActiveTab)
        }
        lastActiveTab = null
        lastActiveTabTimestamp = null
    } else {
        // User has focused back on a window
        chrome.tabs.query({ active: true, windowId }, (tabs) => {
            if (tabs.length > 0) {
                const activeTab = tabs[0]
                if (activeTab.id !== lastActiveTab?.id) {
                    addOldTabToFirestore('User switched to a new window, updating last active tab: ')
                    lastActiveTab = activeTab
                    lastActiveTabTimestamp = Date.now()
                }
            }
        })
    }
})