// takes an amount of time in miliseconds for START, and displays a timer counting up
// TODO: pause timer when window is not in focus

'use strict';
	
var timerHandle;

function startTimer(start, display) {
	var s = Date.now();
    var diff,
        minutes,
        seconds;
    function timer() {
        // get the number of seconds that have elapsed since the saved start time
        var now = new Date()

        var diff = timeToDisplay(start + (now - s));

        var result = "";
        if (parseInt(diff[0]) != 0) {
        	result = 	diff[0] + "<span>d</span>" + " " + 
        				diff[1] + "<span>h</span>" + " " + 
        				diff[2] + "<span>m</span>" + " " + 
        				diff[3] + "<span>s</span>";
        } else if (parseInt(diff[1]) != 0) { 
        	result = diff[1] + "<span>h</span>" + " " + diff[2] + "<span>m</span>" + " " + diff[3] + "<span>s</span>";
        } else if (parseInt(diff[2]) != 0) { 
        	result = diff[2] + "<span>m</span>" + " " + diff[3] + "<span>s</span>"; 
        } else if (parseInt(diff[3]) != 0) { 
        	result = diff[3] + "<span>s</span>" + result; 
        }

        display.innerHTML = result;
    };

    timer();
    var result = setInterval(timer, 1000);
    return result;
};

function clearTimer(timer) {
	if (timer) {
		clearInterval(timer);
	}
}

function displayTotals(container, data) {
	
	if (document.querySelector('#totals-table')) {
    	document.querySelector('#totals-table').remove();
    }

	var table = container.appendChild(document.createElement('table'));
	table.setAttribute('id', 'totals-table');

	var tableHeader = table.createTHead();
	var hrow = tableHeader.insertRow(0);

	hrow.insertCell(0).innerHTML = 'Domain';
	hrow.insertCell(1).innerHTML = 'Time';

	var tablebody = table.appendChild(document.createElement('tbody'));

	for (var i = 0; i < data.length; i++) {
		var row = tablebody.insertRow(i);
		row.insertCell(0).innerHTML = data[i].domain;

		var time = beautifyTime(parseInt(data[i].timeSpentTotal));
		row.insertCell(1).innerHTML = Math.floor(time.time) + ' ' + time.text;
	}
}

// takes a time in miliseconds and returns a string 
function timeToDisplay(t) {
	var cd, ch, cm, d, h, m, s;

	cd = 24 * 60 * 60 * 1000;
	ch = 60 * 60 * 1000;
	cm = 60 * 1000;
	d = Math.floor(t / cd);
	h = Math.floor((t - d * cd) / ch);
	m = Math.floor((t - d * cd - h * ch) / cm);
	s = Math.floor((t - d * cd - h * ch - m * cm) / 1000);

	var pad = function(n){ return n < 10 ? '0' + n : n; };

	if (s === 60) {
		m++;
		s = 0;
	}
	if (m === 60) {
		h++;
		m = 0;
	}
	if (h === 24) {
		d++;
		h = 0;
	}
	return [d , pad(h) , pad(m) , pad(s)];
}

function updateActivityDisplay() {
	var activityTabDisplay = document.querySelector('#tab-count');
	var activityWindowdDisplay = document.querySelector('#window-count');

	chrome.windows.getAll({populate: true}, function(windows) {
		activityWindowdDisplay.innerHTML = windows.length;
		var totalTabs = 0;
		for (var i = 0; i < windows.length; i++) {
			totalTabs += windows[i].tabs.length;
		}
		console.log(totalTabs);
		activityTabDisplay.innerHTML = totalTabs;
	});
};

function loadContent(animate = false) {
	var display = document.querySelector('#time');

    storage.onDatabaseLoaded(initialize);

	function initialize() {
		storage.exportDatabase(function(data) {
			var total = 0;
			var keyToday = new Date().setHours(0,0,0,0);

			// add up total for today
			for (var i = 0; i < data.length; i++) {
				if (data[i].timeSpent[keyToday]) {
					total += parseInt(data[i].timeSpent[keyToday]);
				}
			}

			// filter out non-web urls (extensions, newtab, etc.)
			data = data.filter(function(elem) {
				return elem.domain.indexOf('.') !== -1;
			});

			// keep only sites visited today
			data = data.filter(function(elem) {
				return elem.timeSpent[keyToday];
			});

			// console.log(data.length)

			// sort the data for graphing
			data.sort(function(a, b) {
				return parseInt(b.timeSpent[keyToday]) - parseInt(a.timeSpent[keyToday]);
			});

			clearTimer(timerHandle);
			timerHandle = startTimer(total, display);
			renderBarChart(data.slice(0,10), keyToday, animate);
			renderDonutChart(data, keyToday);
			updateActivityDisplay();
		});
	};
};

window.onload = function () {
    loadContent(true);

    // document.querySelector('#options').addEventListener('onclick', function() {

    // });
}
window.onresize = function() {
	loadContent();
}

chrome.windows.onCreated.addListener(function(window) {
	updateActivityDisplay();
});

chrome.windows.onRemoved.addListener(function(window) {
	updateActivityDisplay();
});

chrome.tabs.onCreated.addListener(function(tab) {
	updateActivityDisplay();
});

chrome.tabs.onRemoved.addListener(function(tab) {
	updateActivityDisplay();
});

window.addEventListener('focus', function() {
	loadContent();
});

window.addEventListener('blur', function() {
	loadContent();
});