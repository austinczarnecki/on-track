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

function setActiveStart(tab) {
	activeStart = Date.now();
	if (verbose) { console.log("new active tab: " + tab.id + " : " + extractDomain(tab.url)); }
}

// takes a url and a value in miliseconds and adds that value to the 
// existing value for that url in storage
function storeTotal(key, value) {
	var total = parseInt(value);
	var global_total = total;

	if ('total' in localStorage) { 
		global_total += parseInt(localStorage.getItem('total')); 
	}
	localStorage.setItem('total', global_total);

	if (key in localStorage) { 
		total += parseInt(localStorage.getItem(key)); 
	}
	localStorage.setItem(key, total);
}

function storeTotalActiveTab(callback) {
	var diff = Date.now() - activeStart;
	if (activeDomain) {
		storeTotal(activeDomain, diff);
		if (verbose) { console.log("stored increment: id="+activeTab+", url="+activeDomain+", time="+(diff/1000)+" seconds"); }
	}
	callback();
}

/* ===================================================== */
// WINDOW LISTENERS

// when closing a window, save and clear the active tab if set
chrome.windows.onRemoved.addListener(function(windowId) {
	if (activeTab) {
		storeTotalActiveTab(function() {
			clearActiveTab();
		});
	}
});

// when window enters or leaves focus, save and clear active tab if set, and try
// to set the active tab to the active tab of the window that came into focus 
chrome.windows.onFocusChanged.addListener(function(windowId) {
	if (activeTab) {
		storeTotalActiveTab(function() {
			clearActiveTab();
		})
	} else {
		chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
			if (tabs.length < 1) {
				if (verbose) { console.log('No active tabs found'); }
		    } else {
				activeTab = tabs[0].id;
				setActiveStart(tabs[0]);
				activeDomain = extractDomain(tabs[0].url);
			}
		});
	}
});

/* ===================================================== */
// TAB LISTENERS

// if the updated tab is the active tab and domain changed, save out the time for the 
// previous domain, reset the counter for the active tab. Else do nothing.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (activeTab) {
		storeTotalActiveTab(function() {
			activeDomain = extractDomain(tab.url);
			setActiveStart(tab);
		});
	}
});

// when a tab becomes active, save any existing active tab and set the new
// tab to be the active tab.
chrome.tabs.onActivated.addListener(function(activeInfo) {
	if (activeTab) { 
		storeTotalActiveTab(function() {
			clearActiveTab();
			activeTab = activeInfo.tabId;
			chrome.tabs.get(activeTab, function(tab) {
				activeDomain = extractDomain(tab.url);
				setActiveStart(tab);
			});
		});
	} else {
		chrome.tabs.get(activeInfo.tabId, function(tab) {
			if (chrome.runtime.lastError) {
		        console.log(chrome.runtime.lastError.message);
		    } else {
		    	clearActiveTab();
		    	activeTab = activeInfo.tabId;
				activeDomain = extractDomain(tab.url);
				setActiveStart(tab);
		    }
		});
	} 
});

// listen to messages from content script notifying if page goes out of 
// view. This uses the blur and focus events.
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	if (activeTab) {
		storeTotalActiveTab(function() {
			clearActiveTab();
			if (message === 'focus') {
				activeTab = sender.tab.id;
				activeDomain = extractDomain(sender.url);
				setActiveStart(sender.tab);
			}
		});
	} else if (message === 'focus') {
		activeTab = sender.tab.id;
		activeDomain = extractDomain(sender.url);
		setActiveStart(sender.tab);
	}
});

/* ===================================================== */