chrome.idle.setDetectionInterval(60)

// checks when the user is active or idle
chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === 'active') {
        userActive()
    } else if (newState === 'idle' || newState === 'locked') {
        userIdle()
    }
})

// checks when the user switches tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
    // adds new entry to firebase
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