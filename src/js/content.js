// adds an event listener that sends a message to 
// the extension when a page loses focus
'use strict';

window.addEventListener("blur", function() {
	chrome.runtime.sendMessage('blur');
});
window.addEventListener('focus', function() {
	chrome.runtime.sendMessage('focus');
});