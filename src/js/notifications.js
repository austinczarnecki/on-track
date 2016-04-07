// check periodically if a notification should be shown and show it if the current
// tab has been open in total for the day longer than the configured notificationThreshold

setInterval(function() {
	storage.getOptions(function(options) {
		if (!options.notifications) { return; } // short circuit if notifications are turned off

		storage.getDelayUntilValueForDomain(activeDomain, function(date) {
			var overThreshold = (localStorage.getItem(activeDomain) > options.notificationThreshold * 1000 * 60);
			var pastDelayUntil = (Date.now() > date);

			if ((overThreshold && !date) || (date && pastDelayUntil)) {
				var total = beautifyTime(localStorage.getItem(activeDomain));
				var delay = beautifyTime(options.notificationDelay * 60 * 1000);

				sendNotification(Math.floor(total.time), total.text, activeDomain, delay.time, delay.text);
			}
		});
	});
}, 4000);

beautifyTime = function(time) {
	var val = 'second'
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

	return {time: time, text: val};
}

sendNotification = function(time, timestring, domain, delay, delaystring) {
	chrome.notifications.create(activeTab.toString(), {
		type: "basic", 
	 	iconUrl: "../../assets/icons/iconTsquare.png", 
	 	title: "You've spent over " + time + " " + timestring + " on " + domain + " today",
	 	// message: "In that time you could read almost 45 pages of a good book",
	 	message: "",
	 	isClickable: true,
	 	// requireInteraction: true,
	 	buttons: [
	 				{title: "Get me back on track, close the tab! (recommended)"},
	 				{title: "Dismiss for " + delay + ' ' + delaystring}
				 ]
	});
}

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
	if (buttonIndex === 0) {
		chrome.tabs.remove(parseInt(notificationId));
		chrome.notifications.clear(notificationId);
	} else if (buttonIndex === 1) {
		var domain;
		var nextNotificationTime = Date.now();

		chrome.tabs.get(parseInt(notificationId), function(tab) {
			storage.getOptions(function(options) {
				domain = extractDomain(tab.url);
				nextNotificationTime = new Date(nextNotificationTime + (options.notificationDelay * 60 * 1000));
				storage.setDelayUntilValueForDomain(domain, nextNotificationTime);
			});
		});

		chrome.notifications.clear(notificationId);
	}
});