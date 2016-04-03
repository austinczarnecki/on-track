// Saves options to chrome.storage
function save_options() {
  var nt = document.getElementById('notificationThreshold').value;
  var nd = document.getElementById('notificationDelay').value;
  var notifications = document.getElementById('notifications').checked;
  chrome.storage.sync.set({
    notificationThreshold: nt,
    notificationDelay: nd,
    notifications: notifications
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    notificationThreshold: 30,
    notificationDelay: 5,
    notifications: true
  }, function(items) {
    document.getElementById('notificationThreshold').value = items.notificationThreshold;
    document.getElementById('notificationDelay').value = items.notificationDelay;
    document.getElementById('notifications').checked = items.notifications;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);