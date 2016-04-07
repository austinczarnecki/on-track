// adds an event listener that sends a message to 
// the extension when a page loses focus
'use strict';

window.addEventListener("blur", function() {
	console.log('focus changed on blur');
	chrome.runtime.sendMessage('blur');
});
window.addEventListener('focus', function() {
	console.log('focus gained')
	chrome.runtime.sendMessage('focus');
});

console.log('context script loaded');
