import { newTabToFirestore, updateTabToFirestore, endAllSessions, retrieveUserId } from "./firestore"

console.log('chrome.idle:', chrome.idle)
chrome.idle.setDetectionInterval(60)

let lastActiveTab = null
let lastActiveTabTimestamp = null
let lastWindowId = null
let pendingTabData = null

function queueTabUpdate(data) {
    pendingTabData = data
}

setInterval(() => {
    if (pendingTabData) {
        updateTabToFirestore(pendingTabData)
        pendingTabData = null
    }
}, 5000)

retrieveUserId().then((userId) => {
    chrome.tabs.onActivated.addListener((activeInfo) => {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            if (!lastActiveTab || tab.id !== lastActiveTab.id) {
                addOldTabToFirestore('User switched to a new tab, updating last active tab: ')
                if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
                    const url = new URL(tab.url)
                    const websiteName = url.hostname.replace('www.', '')
                    const data = {
                        websiteName,
                        timestamp: new Date(),
                        tabId: tab.id, 
                        userId: userId
                    }
                    newTabToFirestore(data)

                    lastActiveTab = tab
                    lastActiveTabTimestamp = Date.now()
                    lastWindowId = tab.windowId
                    console.log('Active tab updated:', lastActiveTab)
                }
            }
        })
    })

    chrome.idle.onStateChanged.addListener((newState) => {
        if (newState === 'idle' || newState === 'locked') {
            addOldTabToFirestore('User is idle, updating last active tab: ')
            lastActiveTab = null
            lastActiveTabTimestamp = null
        }
    })

    chrome.runtime.onSuspend.addListener(() => {
        addOldTabToFirestore('Extension is suspending, updating last active tab: ')
        lastActiveTab = null
        lastActiveTabTimestamp = null
        endAllSessions()
    })

    chrome.windows.onFocusChanged.addListener((windowId) => {
        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            addOldTabToFirestore('User switched to a different window or minimized, updating last active tab: ')
            lastActiveTab = null
            lastActiveTabTimestamp = null
        } else {
            chrome.tabs.query({ active: true, windowId }, (tabs) => {
                if (tabs.length > 0) {
                    const activeTab = tabs[0]
                    if (activeTab.id !== lastActiveTab?.id) {
                        addOldTabToFirestore('User switched to a new window, updating last active tab: ')
                        lastActiveTab = activeTab
                        lastActiveTabTimestamp = new Date()
                    }
                }
            })
        }
    })
})