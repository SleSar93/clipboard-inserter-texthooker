// Clipboard Inserter - Offscreen Document Script
// Uses a hidden textarea + document.execCommand('paste') to read clipboard
// This works even when the browser window is not focused (with clipboardRead permission)

const textarea = document.getElementById('clipboard-textarea');
let lastText = '';
let monitoringInterval = null;
let pollInterval = 100; // ms — lower = less latency

function readClipboard() {
  try {
    textarea.value = '';
    textarea.focus();
    document.execCommand('paste');
    const text = textarea.value;

    if (text && text !== lastText) {
      lastText = text;
      chrome.runtime.sendMessage({
        type: 'clipboard-data',
        text: text
      }).catch(() => {});
    }
  } catch (e) {
    // Silently handle clipboard read errors
  }
}

function startMonitoring() {
  if (monitoringInterval) return;
  monitoringInterval = setInterval(readClipboard, pollInterval);
  // Also read immediately
  readClipboard();
}

function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

function updateInterval(newInterval) {
  pollInterval = newInterval;
  if (monitoringInterval) {
    stopMonitoring();
    startMonitoring();
  }
}

// Listen for control messages from the background service worker
chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'start-monitoring':
      startMonitoring();
      break;
    case 'stop-monitoring':
      stopMonitoring();
      break;
    case 'update-interval':
      updateInterval(message.interval);
      break;
  }
});

// Auto-start monitoring (interval is controlled by messages from background)
startMonitoring();
