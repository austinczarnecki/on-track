// Author: 		Austin Czarnecki
// Created on: 	Saturday, April 2, 2016

'use strict';

var verbose = true; // used for logging, remove when publishing

// TODO: set timeout for time between load and time specified for daily refresh

var activeTab,
	activeStart,
	activeDomain,
	notificationStop = false;

function clearActiveTab() {
	activeTab = null;
	activeStart = null;
	activeDomain = null;
	notificationStop = false;
}

// when closing a window, clear active tab
chrome.windows.onRemoved.addListener(function(windowId) {
	if (activeTab) {
		storeTotalActiveTab(function() {
			clearActiveTab();
		});
	}
});

// if focus moves, save out increment and reset active tab vars. When focus returns, set them
// again. NOTE: this event is only fired when chrome window changes, not when switching to another app
chrome.windows.onFocusChanged.addListener(function(windowId) {
	// clear all notifications on change of window
	chrome.notifications.getAll(function(notifications) {
		var n = Object.keys(notifications);
		for (var i = 0; i < n.length; i++) { 
			chrome.notifications.clear(n[i]);
		}
	})

	if (activeTab) {
		storeTotalActiveTab(function() {
			clearActiveTab();
		})
	} else {
		chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
			// console.log('here')
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

// if the updated tab is the active tab and domain changed, save out the time for the 
// previous domain, reset the counter for the active tab. Else do nothing.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// alert('tabs.onUpdated')
	if (activeTab) {
		storeTotalActiveTab(function() {
			activeDomain = extractDomain(tab.url);
			setActiveStart(tab);
		});
	}
});

// takes a url and a value in miliseconds and adds that value to the 
// existing value for that url in localStorage
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

function setActiveStart(tab) {
	activeStart = Date.now();
	if (verbose) { console.log("new active tab: " + tab.id + " : " + extractDomain(tab.url)); }
}

// when tab becomes active, record activity of previous active tab
// and set new tab parameters
chrome.tabs.onActivated.addListener(function(activeInfo) {
	console.log("tabs.onActivated")
	// if there was an active tab, save out the time that tab was active
	if (activeTab) { 
		storeTotalActiveTab(function() {
			clearActiveTab();
			activeTab = activeInfo.tabId;
			chrome.tabs.get(activeTab, function(tab) {
				activeDomain = extractDomain(tab.url);
				setActiveStart(tab);
			})
		})
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