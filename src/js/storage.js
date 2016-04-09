/* 	
	Author: 		Austin Czarnecki
	Created on: 	Sunday, April 3, 2016

	This file creates the required storage model used by 
	the javascript files to manage history and options data.
*/

'use strict';

var storage = (function () {

	/* ===================================================== */
	// DB UTILITIES

	// TODO: queue up transaction to be retried?
	function logTransactionError(event) {
		console.log('error in transaction');
	}

	function logTransactionSuccess(event) {
		console.log('transaction succeeded')
	}

	/* ===================================================== */
	// BROWSING HISTORY DATA

	const DB_NAME = 'on-track-browsing-history';
	const DB_VERSION = 1;
	const DB_STORE_NAME = 'history';
 	
 	function DB() {};

 	var db;
 	var result = new DB();

 	// open and update the database
	function openDb() {
		console.log("openDb ...");
		var req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onsuccess = function (evt) {
			db = this.result;
			console.log("openDb DONE");
		};
		req.onerror = function (evt) {
			console.error("openDb:", evt.target.errorCode);
		};

		req.onupgradeneeded = function (evt) {
			console.log("openDb.onupgradeneeded");

			// create new store 
			var store = evt.currentTarget.result.createObjectStore(
				DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });

			store.createIndex('domain', 'domain', { unique: true });
		};
	}

	// get the database object for DB
	DB.prototype.getDb = function() {
		if (db) { return db; } 
		else { throw 'DB not accessible'; }
	};

	// add new domain to database (TODO: include defaults)
	DB.prototype.addDomain = function(domain, callback) {
		if (typeof domain !== 'string') { throw 'Error: DOMAIN passed to addDomain() must be a string'; };

		var objectStore = db.transaction(["history"], "readwrite").objectStore("history");

		var checkDomain = objectStore.index('domain').get(domain).onsuccess = function(event) {
			var result = event.target.result;
			if (result) {
				console.log('Existing record found for ' + result.domain + ', no record added');
				typeof callback === 'function' && callback();
			} else {
				var request = objectStore.add({ domain: domain });
				request.onsuccess = function(event) {
					console.log('successfully added record for ' + domain);
					typeof callback === 'function' && callback();
				};
				request.onerror = function(event) {
					throw event.target.error;
				}
			}
		}
	};

	// get full record for a domain, calls callback passing in the result
	DB.prototype.getDomainEntry = function(domain, callback) {
		var objectStore = db.transaction(["history"], "readwrite").objectStore("history");
		
		var request = objectStore.index('domain').get(domain).onsuccess = function(event) {
			var result = event.target.result;
			if (result) {
				console.log('retrieved full record for ' + result.domain);
				typeof callback === 'function' && callback(result);
			} else {
				console.log('record not found for [' + domain + ']');
			}
		}
		request.onerror = function(event) {};
	};

	// get Notification policy for domain
	DB.prototype.getNotificationPolicyForDomain = function(domain, callback) {
		var objectStore = db.transaction(["history"], "readwrite").objectStore("history");

		var request = objectStore.index('domain').get(domain).onsuccess = function(event) {
			var result = event.target.result;
			if (result) {
				console.log('notificationPolicy for ' + domain + ' is ' + result.notificationPolicy);
				typeof callback === 'function' && callback(result.notificationPolicy);
			} else {
				console.log('could not find notificationPolicy for ' + domain);
			}
		};
		request.onerror = function(event) {};
	};

	// set notification policy for existing domain
	// DOMAIN is string; POLICY is boolean
	DB.prototype.setNotificationPolicyForDomain = function(domain, policy) {
		if (typeof policy !== 'boolean') { 
			throw 'Error: POLICY passed to setNotificationPolicyForDomain() must be a boolean'; 
		};

		var objectStore = db.transaction(["history"], "readwrite").objectStore("history");
		var request = objectStore.index('domain').get(domain);

		request.onsuccess = function(event) {
			var data = request.result;
			data.notificationPolicy = policy;

			var requestUpdate = objectStore.put(data).onsuccess = function(event) { 
				console.log('successfully set notificationPolicy to ' + policy + ' for ' + domain);
			};

			requestUpdate.onerror = function(event) { 
				throw 'failed to set notificationPolicy on ' + domain + ' with error: ' + event.target.error;
			};
		};
		request.onerror = function(event) {};
	};

	// get delay-until value for specific domain
	DB.prototype.getDelayUntilValueForDomain = function(domain, callback) {
		var objectStore = db.transaction(["history"], "readwrite").objectStore("history");

		var request = objectStore.index('domain').get(domain).onsuccess = function(event) {
			var result = event.target.result;
			if (result) {
				console.log('delayUntil for ' + domain + ' is ' + result.delayUntil);
				typeof callback === 'function' && callback(result.delayUntil);
			} else {
				console.log('could not find delayUntil value for ' + domain);
				typeof callback === 'function' && callback(null);
			}
		};
		request.onerror = function(event) {};
	};
	
	// set delay-until for existing domain
	DB.prototype.setDelayUntilValueForDomain = function(domain, date) {
		if (!(date instanceof Date)) { 
			throw 'Error: date passed to setNotificationPolicyForDomain() must be a Date object'; 
		};
		console.log(date)

		var objectStore = db.transaction(["history"], "readwrite").objectStore("history");
		var request = objectStore.index('domain').get(domain);

		request.onsuccess = function(event) {
			var data = request.result;
			data.delayUntil = date;

			var requestUpdate = objectStore.put(data).onsuccess = function(event) { 
				console.log('successfully set delayUntil to ' + date + ' for ' + domain);
			};

			requestUpdate.onerror = function(event) { 
				throw 'failed to set delayUntil on ' + domain + ' with error: ' + event.target.error;
			};
		};
		request.onerror = function(event) {};
	};

	// add time-spent record to existing domain (also updates total time for that domain)
	// increment count record for existing domain (also updates total count for that domain)
	// TODO: 	Be careful about splitting time and incrementing both daily counts if record goes across 
	// 			midnight (or theoretically) for multiple days
	DB.prototype.addTimeSpentToDomain = function(domain, time) {
		console.log(domain);
		if (typeof domain !== 'string') { 
			throw 'Error: DOMAIN passed to addTimeSpentToDomain() must be a string'; 
		}
		if (typeof time !== 'number') {
			throw 'Error: TIME passed to addTimeSpentToDomain() must be a number';
		};

		// for now only increment a single time-spent attribute
		var objectStore = db.transaction(["history"], "readwrite").objectStore("history");
		var request = objectStore.index('domain').get(domain);

		request.onsuccess = function(event) {
			if (!request.result) {
				storage.addDomain(domain, function() {
					storage.addTimeSpentToDomain(domain, time);
				});
			} else {

				var data = request.result;
				var end = new Date();
				var start = new Date(end - time);
				var dateId = end.setHours(0,0,0,0);

				// add count by day information for this domain
				// if (start.getDate() !== end.getDate()) {
				// 	console.log('over midnight')

				// } else {
				// 	data.count[]
				// }

				// initialize count tracker if it doesn't already exist and increment
				if (!data.count) { data.count = new Object(); };
				if (!data.count[dateId]) { data.count[dateId] = 0; };
				data.count[dateId] ++;

				// initialize time spent tracker if not already there and add time
				if (!data.timeSpent) { data.timeSpent = new Object(); };
				if (!data.timeSpent[dateId]) { data.timeSpent[dateId] = 0; };
				data.timeSpent[dateId] += time;
				
				// update grand total time spent for this domain
				if (data.timeSpentTotal) { data.timeSpentTotal = data.timeSpentTotal + time; } 
				else { data.timeSpentTotal = time; }

				// update grand total count of visits to this domain
				if (data.countTotal) { data.countTotal++; } 
				else { data.countTotal = 1; }

				// console.log('attempting to update total timeSpent for '+ domain + ' to ' + data.timeSpentTotal);
				// console.log('attempting to update total count for '+ domain + ' to ' + data.countTotal);

				var requestUpdate = objectStore.put(data).onsuccess = function(event) { 
					console.log('successfully saved updated record for ' + domain);
				};

				requestUpdate.onerror = function(event) { 
					throw 'failed to update record for ' + domain + ' with error: ' + event.target.error;
				};
			}
		};
		request.onerror = function(event) {};
	};

	// get full list of domains and pass into callback
	DB.prototype.getAllDomains = function(callback) {
		var result = [];
		var objectStore = db.transaction(["history"], "readonly").objectStore("history");
		
		objectStore.openCursor().onsuccess = function (event) {
			var cursor = event.target.result;
			if (cursor) {
				result.push(cursor.value.domain);
				cursor.continue();
			} else {
				console.log('found domain records for: ');
				console.log(result);
				typeof callback === 'function' && callback(result);
			}
		};
	};

	// get total counts on all domains for date and pass into callback
	DB.prototype.getAllCountsForDate = function(date, callback) {
		//TODO
	};

	// get total time-spent on all domains for date and pass into callback
	DB.prototype.getAllTimeSpentForDate = function(date, callback) {
		//TODO
	};

	// get list of domains showing notifications and pass into callback
	DB.prototype.getAllNotificationDomains = function(callback) {
		var result = [];
		var objectStore = db.transaction(["history"], "readonly").objectStore("history");
		var request = objectStore.openCursor().onsuccess = function (event) {
			var cursor = event.target.result;
			if (cursor) {
				if (cursor.value.notificationPolicy === true) {
					result.push(cursor.value.domain);
				}
				cursor.continue();
			} else {
				console.log(result);
				typeof callback === 'function' && callback(result);
			}
		};
		request.onerror = function(event) {};
	};

	// get full set of domain records and pass into callback
	DB.prototype.exportDatabase = function(callback) {
		var objectStore = db.transaction(["history"], "readonly").objectStore("history");
		var request = objectStore.getAll().onsuccess = function (event) {
			console.log(event.target.result);
			typeof callback === 'function' && callback(event.target.result);
		};
	};

	// TODO: add db.onload function
	DB.prototype.onDatabaseLoaded = function(callback) {
		var checker = setInterval(function() {
			if (db) { end(); }
		});
		function end() {
			clearInterval(checker);
			typeof callback === 'function' && callback();
		};
	};

	/* ===================================================== */
	// OPTIONS CONFIGURATION
	const OPTIONS = 
	[
		'notifications', 
		'startDate',
		'notificationThreshold',
		'notificationDelay',
		'storeDataUntil',
		'storeDailyDataUntil'
	]

	chrome.runtime.onInstalled.addListener(function (details) {
		var start = new Date();
		chrome.storage.sync.set({
			'startDate': start.toString(),
			'notifications': true,
			'notificationThreshold': 1800000,
			'notificationDelay': 300000,
			'storeDataUntil': 'f',
			'storeDailyDataUntil': 'f'
		});
	});

	DB.prototype.getOptions = function(callback) {
		chrome.storage.sync.get(OPTIONS, function(obj) {
			callback(obj);
		});
	};

	DB.prototype.setOptions = function(options, callback) {
		chrome.storage.sync.set(options, function(obj) {
			callback(obj);
		})
	};

	/* ===================================================== */

	openDb();

	return result;

})();