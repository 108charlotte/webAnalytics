import { newTabToFirestore, updateTabToFirestore } from "./firestore"

console.log('chrome.idle:', chrome.idle)

chrome.idle.setDetectionInterval(60)

let lastActiveTab = null
let lastActiveTabTimestamp = null
let lastWindowId = null
let pendingTabData = null

// Call this whenever you want to "queue" an update
function queueTabUpdate(data) {
    pendingTabData = data
}

// Periodically flush the pending update to Firestore
setInterval(() => {
    if (pendingTabData) {
        updateTabToFirestore(pendingTabData)
        pendingTabData = null
    }
}, 5000)

// when the user becomes active, get the newly active tab and export to firebase with start time at that time
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (!lastActiveTab || tab.id !== lastActiveTab.id) {
            addOldTabToFirestore('Updated last active tab before switching to new one: ')
            if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
                const url = new URL(tab.url)
                const websiteName = url.hostname.replace('www.', '')
                const data = {
                    websiteName,
                    timestamp: new Date(),
                }
                newTabToFirestore(data)

                // update the last active tab
                addOldTabToFirestore('Updated last active tab before switching to new one: ')

                lastActiveTab = tab
                lastActiveTabTimestamp = Date.now()
                lastWindowId = tab.windowId
                console.log('Active tab updated:', lastActiveTab)
            }
        }
    })
})

// when the user becomes idle, update the end date of the firebase entry for the last active tab (need to store somewhere)
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
                setIdle: new Date(),
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
                    updateTabToFirestore('User switched to a new window, updating last active tab: ')
                    addOldTabToFirestore('User switched to a new window, updating last active tab: ')
                    lastActiveTab = activeTab
                    lastActiveTabTimestamp = new Date()
                }
            }
        })
    }
})

function addOldTabToFirestore(message) {
    if (lastActiveTab && lastActiveTab.url) {
        let hostname;
        try {
            hostname = new URL(lastActiveTab.url).hostname.replace('www.', '');
        } catch (e) {
            console.warn('Error parsing URL:', lastActiveTab.url, e);
            return;
        }
        const lastData = {
            websiteName: hostname,
            setIdle: new Date(),
        };
        queueTabUpdate(lastData)
        console.log(message, lastActiveTab);
    }
}