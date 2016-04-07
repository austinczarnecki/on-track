// Utility functions

'use strict';

// extracts a domain from a full URL, removes 'www.' from any domain that has it.
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

// takes time in miliseconds, and returns that time in a sensible amount:
// days, minutes, hours or seconds depending on the length) along with the 
// correct pluralized text label for that amount
function beautifyTime(time) {
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