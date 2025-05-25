/******/ (() => { // webpackBootstrap
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
console.log('chrome.idle:', chrome.idle);
chrome.idle.setDetectionInterval(60);
var lastActiveTab = null;
var lastActiveTabTimestamp = null;
var lastWindowId = null;

// checks when the user is active or idle
chrome.idle.onStateChanged.addListener(function (newState) {
  if (newState === 'active') {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      if (tabs.length > 0) {
        lastActiveTab = tabs[0];
        lastActiveTabTimestamp = Date.now();
        lastWindowId = lastActiveTab.windowId;
      }
    });
    userActive();
  } else if (newState === 'idle' || newState === 'locked') {
    userIdle();
  }
});

// checks when the user switches tabs
chrome.tabs.onActivated.addListener(function (activeInfo) {
  // adds old tab to firebase
  getActiveTab(function (tab) {
    var url = new URL(tab.url);
    var websiteName = url.hostname.replace('www.', '');
    var data = {
      websiteName: websiteName,
      timestamp: Date.now()
    };
    newTabToFirestore(data);
  });
});

// checks when the user switches windows
chrome.windows.onFocusChanged.addListener(function (windowID) {
  if (windowID === chrome.windows.WINDOW_ID_NONE) {
    userIdle();
  } else {
    userActive();
  }
});
function getActiveTab(callback) {
  chrome.windows.getLastFocused({
    populate: true
  }, function (window) {
    var activeTab = window.tabs.find(function (tab) {
      return tab.active;
    });
    if (activeTab) callback(activeTab);
  });
}
function userActive() {
  chrome.tabs.onActivated.addListener(function (activeInfo) {
    var tabId = activeInfo.tabId,
      windowId = activeInfo.windowId;
  });
  // update firestore with new entry
  getActiveTab(function (tab) {
    var url = new URL(tab.url);
    var websiteName = url.hostname.replace('www.', '');
    var data = {
      websiteName: websiteName,
      timestamp: Date.now()
    };
    sendToFirestore(data);
  });
}
function userIdle() {}
/******/ })()
;
//# sourceMappingURL=background.bundle.js.map