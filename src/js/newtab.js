// takes an amount of time in miliseconds for START, and displays a timer counting up
// TODO: pause timer when window is not in focus

'use strict';

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
    setInterval(timer, 1000);
}

function displayTotals(table) {
	tableHeader = table.createTHead();
	hrow = tableHeader.insertRow(0);
	hrow.insertCell(0).innerHTML = 'Domain';
	hrow.insertCell(1).innerHTML = 'Time';
	tablebody = table.appendChild(document.createElement('tbody'))
	for (var i = 0; i < localStorage.length; i++) {
		var row = tablebody.insertRow(i);
		row.insertCell(0).innerHTML = localStorage.key(i);
		row.insertCell(1).innerHTML = timeToDisplay(parseInt(localStorage.getItem(localStorage.key(i))));
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

// pulls data about website usage from 
function extractData() {
	// get array of key: value pairs
	data = []
	for (var i = 0; i < localStorage.length; i++) {
	}
	// sort array and return
	return data;
}

window.onload = function () {

	for (var i in localStorage) {
		console.log(i + " : " + window.localStorage.getItem(i))
	}

    var display = document.querySelector('#time');

    var start = parseInt(localStorage.getItem('total'))
    startTimer(start, display);

    var data = extractData();

    var table = document.querySelector('#totals');
    displayTotals(table);

};