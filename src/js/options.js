'use strict';

function save_options() {
  var nt = document.getElementById('notificationThreshold').value;
  var nd = document.getElementById('notificationDelay').value;
  var notifications = document.getElementById('notifications').checked;
  storage.setOptions({
    notificationThreshold: nt,
    notificationDelay: nd,
    notifications: notifications
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
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);