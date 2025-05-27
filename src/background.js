import { newTabToFirestore, updateTabToFirestore, endAllSessions } from "./firestore"

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

// creates unique user ID (see resources for the stack overflow article I got this function from)
function getRandomToken() {
    var randomPool = new Uint8Array(32)
    crypto.getRandomValues(randomPool)
    var hex = ''
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16)
    }
    return hex;
}

// when the user becomes active, get the newly active tab and export to firebase with start time at that time
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

// when the user becomes idle, update the end date of the firebase entry for the last active tab (need to store somewhere)
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
        // User has switched to a different window or minimized the current one
        addOldTabToFirestore('User switched to a different window or minimized, updating last active tab: ')
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
        
        // also from stack overflow, this is how to use the token
        chrome.storage.sync.get('userid', function(items) {
            var userid = items.userid
            if (userid) {
                useToken(userid)
            } else {
                userid = getRandomToken()
                chrome.storage.sync.set({userid: userid}, function() {
                    useToken(userid)
                })
            }
            function useToken(userid) {
                console.log('Using user ID:', userid)
                const lastData = {
                    websiteName: hostname,
                    setIdle: new Date(),
                    tabId: lastActiveTab.id,
                    userId: userid
                };
            }
        })
        queueTabUpdate(lastData)
        console.log(message, lastActiveTab);
    }
}