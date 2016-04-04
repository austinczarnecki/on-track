// Author: 		Austin Czarnecki
// Created on: 	Saturday, April 2, 2016

'use strict';

var verbose = true; // used for logging, remove when publishing

// save the date when the extension was installed
chrome.runtime.onInstalled.addListener(function (details) {
	var start = new Date();
	chrome.storage.sync.set({
		'startDate': start.toString(),
		'notifications': true,
		'notificationThreshold': 30,
		'notificationDelay': 5
	});
})

// TODO: set timeout for time between load and time specified for daily refresh

function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }
    //find & remove port number
    domain = domain.split(':')[0];
    domain = domain.replace('www.', '');

    return domain;
}

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

chrome.windows.onRemoved.addListener(function(windowId) {
	if (activeTab) {
		storeTotalActiveTab(function() {
			clearActiveTab();
		});
	}
});

// if focus moves, save out increment and reset active tab vars. When focus returns, set them
// again.
chrome.windows.onFocusChanged.addListener(function(windowId) {
	// clear all notifications
	console.log('here')
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

// check periodically if a notification should be shown and show it if the current
// tab has been open longer than the notification Threshold
setInterval(function() {
	chrome.storage.sync.get(['notificationThreshold', 'notificationDelay', 'notifications'], function(obj) {
		if (!obj.notifications) { return; }

		// if active site has a total time > 2 minutes, send a notification
		if (localStorage.getItem(activeDomain) > obj.notificationThreshold * 1000 * 60 && 
			notificationStop == false && activeTab) {

			notificationStop = true;

			var time = localStorage.getItem(activeDomain);
			var val = 'second';
			time = time / 1000;

			if (time >= 60) {
				time = time / 60;
				val = 'minute';
			}
			if (time >= 60 && val == 'minute') {
				time = time / 60;
				val = 'hour';
			}
			if (time >= 24 && val == 'hour') {
				time = time / 24;
				val = 'day';
			}

			if (Math.floor(time) > 1) {
				val += 's';
			}

			var ndval;
			if (obj.notificationDelay > 1) {
				ndval = 'minutes';
			} else {
				ndval = 'minute';
			}

			chrome.notifications.create(activeTab.toString(), 
				{
					type: "basic", 
				 	iconUrl: "../../assets/icons/iconTsquare.png", 
				 	title: "You've spent over " + Math.floor(time) + " " + val + " on " + activeDomain + " today",
				 	// message: "In that time you could read almost 45 pages of a good book",
				 	message: "",
				 	isClickable: true,
				 	// requireInteraction: true,
				 	buttons: [
				 				{title: "Get me back on track, close the tab! (recommended)"},
				 				{title: "Dismiss for " + obj.notificationDelay + ' ' + ndval}
				 				// {title: obj.notificationDelay + " more minutes please"}
							 ]
				}
			)
		}
	})
	
}, 4000);

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
	if (buttonIndex === 0) {
		chrome.tabs.remove(parseInt(notificationId));
		chrome.notifications.clear(notificationId);
	} else if (buttonIndex === 1) {
		// TODO: set timer to delay by notificationDelay minutes before next notification
		chrome.notifications.clear(notificationId);
	}
});

// when tab becomes active, record activity of previous active tab
// and set new tab parameters
chrome.tabs.onActivated.addListener(function(activeInfo) {
	// console.log("tabs.onActivated")
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
