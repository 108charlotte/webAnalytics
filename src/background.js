console.log('chrome.idle:', chrome.idle)

chrome.idle.setDetectionInterval(60)

let lastActiveTab = null
let lastActiveTabTimestamp = null
let lastWindowId = null

// checks when the user is active or idle
chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === 'active') {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                lastActiveTab = tabs[0]
                lastActiveTabTimestamp = Date.now()
                lastWindowId = lastActiveTab.windowId
            }
        })
        userActive()
    } else if (newState === 'idle' || newState === 'locked') {
       userIdle()
    }
})

// checks when the user switches tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
    // adds old tab to firebase
    getActiveTab((tab) => {
        const url = new URL(tab.url)
        const websiteName = url.hostname.replace('www.', '')
        const data = {
            websiteName,
            timestamp: Date.now(),
        }
        newTabToFirestore(data)
    })
})

// checks when the user switches windows
chrome.windows.onFocusChanged.addListener((windowID) => {
    if (windowID === chrome.windows.WINDOW_ID_NONE) {
        userIdle()
    } else {
        userActive()
    }
})



function getActiveTab(callback) {
    chrome.windows.getLastFocused({populate: true}, (window) => {
        const activeTab = window.tabs.find(tab => tab.active)
        if (activeTab) callback(activeTab)
    })
}

function userActive() {
    chrome.tabs.onActivated.addListener((activeInfo) => {
        const { tabId, windowId } = activeInfo
    })
    // update firestore with new entry
    getActiveTab((tab) => {
        const url = new URL(tab.url)
        const websiteName = url.hostname.replace('www.', '')
        const data = {
            websiteName,
            timestamp: Date.now(),
        }
        sendToFirestore(data)
    })
}

function userIdle() {

}