// Author: 		Austin Czarnecki
// Created on: 	Saturday, April 2, 2016

'use strict';

var verbose = true; // used for logging, remove when publishing

// TODO: set timeout for time between load and time specified for daily refresh

/* ===================================================== */
// MAIN VARIABLES AND HELPER FUNCTIONS

var activeTab,
	activeStart,
	activeDomain;

function clearActiveTab() {
	activeTab = activeStart = activeDomain = null;
}

function setActiveStart(domain) {
	activeStart = Date.now();
	if (verbose) { console.log("new active tab: " + domain); }
}

// takes a url and a value in miliseconds and adds that value to the 
// existing value for that url in storage
function storeIncrement(domain, time) {
	time = parseInt(time);

	try {
		storage.addTimeSpentToDomain(domain, time);
	} catch(err) {
		storage.addTimeSpentToDomain(domain, time);
	}
}

function storeTotalActiveTab(domain, start, tabId) {
	var diff = Date.now() - start;
	if (domain) { storeIncrement(domain, diff); }
};

/* ===================================================== */
// WINDOW LISTENERS

// when closing a window, save and clear the active tab if set
chrome.windows.onRemoved.addListener(function(windowId) {
	if (activeDomain) {
		storeTotalActiveTab(activeDomain, activeStart, activeTab);
		clearActiveTab();
	}
});

// when window enters or leaves focus, save and clear active tab if set, and try
// to set the active tab to the active tab of the window that came into focus 
chrome.windows.onFocusChanged.addListener(function(windowId) {
	if (activeDomain) {
		storeTotalActiveTab(activeDomain, activeStart, activeTab);
		clearActiveTab();
	} else {
		chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
			if (tabs.length < 1) {
				if (verbose) { console.log('No active tabs found'); }
		    } else {
				activeTab = tabs[0].id;
				activeDomain = extractDomain(tabs[0].url);
				setActiveStart(activeDomain);
			}
		});
	}
});

/* ===================================================== */
// TAB LISTENERS

// if the updated tab is the active tab and domain changed, save out the time for the 
// previous domain, reset the counter for the active tab. Else do nothing.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (activeDomain) {
		storeTotalActiveTab(activeDomain, activeStart, activeTab);
		activeDomain = extractDomain(tab.url);
		activeTab = tabId;
		setActiveStart(activeDomain);
	}
});

// when a tab becomes active, save any existing active tab and set the new
// tab to be the active tab.
chrome.tabs.onActivated.addListener(function(activeInfo) {
	if (activeDomain) {
		storeTotalActiveTab(activeDomain, activeStart, activeTab);
		clearActiveTab();
		activeTab = activeInfo.tabId;
		chrome.tabs.get(activeTab, function(tab) {
			activeDomain = extractDomain(tab.url);
			setActiveStart(activeDomain);
		});
	} else {
		chrome.tabs.get(activeInfo.tabId, function(tab) {
			if (chrome.runtime.lastError) {
		        console.log(chrome.runtime.lastError.message);
		    } else {
		    	clearActiveTab();
		    	activeTab = tab.id;
				activeDomain = extractDomain(tab.url);
				setActiveStart(activeDomain);
		    }
		});
	} 
});

// listen to messages from content script notifying if page goes out of 
// view. This uses the blur and focus events.
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (activeDomain) {
		storeTotalActiveTab(activeDomain, activeStart, activeTab);
		clearActiveTab();
	} 
	if (message === 'focus') {
		console.log(sender)
		activeTab = sender.tab.id;
		activeDomain = extractDomain(sender.tab.url);
		setActiveStart(activeDomain);
	}
});

/* ===================================================== */