'use strict';

function save_options() {
  var notificationThreshold = document.getElementById('notificationThreshold').value;
  var notificationDelay = document.getElementById('notificationDelay').value;
  var notifications = document.getElementById('notifications').checked;
  var storeDataUntil = document.getElementById('storeDataUntil').value;
  var storeDailyDataUntil = document.getElementById('storeDailyDataUntil').value;
  storage.setOptions({
    notificationThreshold: notificationThreshold,
    notificationDelay: notificationDelay,
    notifications: notifications,
    storeDataUntil: storeDataUntil,
    storeDailyDataUntil: storeDailyDataUntil
  }, function() {
    // let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the stored preferences
function restore_options() {
  storage.getOptions(function(options) {
    document.getElementById('notificationThreshold').value = options.notificationThreshold;
    document.getElementById('notificationDelay').value = options.notificationDelay;
    document.getElementById('notifications').checked = options.notifications;
    document.getElementById('storeDataUntil').value = options.storeDataUntil;
    document.getElementById('storeDailyDataUntil').value = options.storeDailyDataUntil;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);