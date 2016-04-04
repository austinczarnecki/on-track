/* 	
	Author: 		Austin Czarnecki
	Created on: 	Sunday, April 3, 2016

	This file creates the required storage model used by 
	the javascript files to manage history and options data 
*/

'use strict';

var storage = (function () {

	/* ===================================================== */
	// HISTORY DATA

	const DB_NAME = 'on-track-browsing-history';
	const DB_VERSION = 2;
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
			
			// delete old store	DON"T DO THIS IN PRODUCTION (will remove history)	
			evt.currentTarget.result.deleteObjectStore(DB_STORE_NAME);

			// create new store 
			var store = evt.currentTarget.result.createObjectStore(
				DB_STORE_NAME, { autoIncrement: true });

			// add indexes here
		};
	}

	// get the database object for DB
	DB.prototype.getDb = function() {
		if (db) {
			return db;
		} else {
			throw 'DB not accessible';
		}
	};

	// add new domain to database (TODO: include defaults)
	DB.prototype.addDomains = function(domains) {
		console.log(typeof domains)
		if (typeof(domains) == 'string') {
			domains = [domains];
		}

		var transaction = db.transaction(["history"], "readwrite");

		transaction.oncomplete = function(event) {
			// TODO: do something on transaction complete?
		};

		transaction.onerror = function(event) {
			// TODO: handle errors	
		};

		var objectStore = transaction.objectStore("history");
		console.log(domains.length)
		for (var i = 0; i < domains.length; i++) {
			var request = objectStore.add(domains[i]);
			request.onsuccess = function(event) {
				console.log(event)
				console.log('successfully added record');
			};
		}
	};

	// get full record for one or more domains
	DB.prototype.getDomainEntry = function(domain) {
		var transaction = db.transaction(["history"], "readwrite");

		transaction.oncomplete = function(event) {
		};

		transaction.onerror = function(event) {
		};

		var objectStore = transaction.objectStore("history");
		
		objectStore.openCursor().onsuccess = function(event) {
			var cursor = event.target.result;
			if (cursor) {
				if (cursor.value == domain) {
					console.log("Key " + cursor.key + " contains entry " + cursor.value);
				}
				cursor.continue();
			}
		}
	};

	// set notification policy for existing domain
	DB.prototype.setNotificationPolicyForDomain = function(domain) {

	};

	// add count record to existing domain (also updates total count for that domain)
	DB.prototype.addCountToDomain = function(domain, count) {

	};

	// add time-spent record to existing domain (also updates total time for that domain)
	// NOTE: be careful about splitting time if record goes across midnight
	DB.prototype.addTimeSpentToDomain = function(domain, time) {

	};

	// set delay-until for existing domain
	DB.prototype.setDelayUntilValueForDomain = function(domain, timestamp) {

	};

	// get full list of domains
	DB.prototype.getAllDomains = function() {

	};

	// get total counts on all domains for date
	DB.prototype.getAllCountsForDate = function(date) {

	};

	// get total time-spent on all domains for date
	DB.prototype.getAllTimeSpentForDate = function(date) {

	};

	// get list of domains showing notifications
	DB.prototype.getAllNotificationDomains = function() {

	};

	// get delay-until value for specific domain
	DB.prototype.getDelayUntilValueForDomain = function(domain) {

	};

	// get full database to print
	DB.prototype.exportDatabase = function() {

	};

	/* ===================================================== */
	// OPTIONS DATA

	// TODO: initialize sync store for option configurations

	DB.prototype.getOptionNotifications = function() {
		
	};
	DB.prototype.setOptionNotifications = function(val) {

	};

	DB.prototype.getOptionNotificationDelay = function() {

	}
	DB.prototype.setOptionNotificationDelay = function(val) {

	}

	DB.prototype.getOptionNotificationThreshold = function() {

	}
	DB.prototype.setOptionNotificationThreshold = function(val) {

	}

	DB.prototype.getOptionRolloverTime = function() {

	}
	DB.prototype.setOptionRolloverTime = function(val) {

	}

	// TODO: set track-by-day-threshold (hard-code to 1yr for now)
	DB.prototype.getOptionTrackByDayThreshold = function() {
		return 365;
	}

	/* ===================================================== */

	openDb();

	return result;

})();