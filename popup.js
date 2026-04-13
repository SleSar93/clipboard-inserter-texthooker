// Clipboard Inserter - Popup Script

const toggleEnabled = document.getElementById('toggle-enabled');
const statusDot = document.getElementById('status-dot');
const openTexthooker = document.getElementById('open-texthooker');
const pollIntervalInput = document.getElementById('poll-interval');

// ── Get current status ──
chrome.runtime.sendMessage({ type: 'get-status' }, (response) => {
  if (response) {
    toggleEnabled.checked = response.enabled;
    updateStatusDot(response.enabled);
  }
});

// ── Get current interval ──
chrome.runtime.sendMessage({ type: 'get-interval' }, (response) => {
  if (response) {
    pollIntervalInput.value = response.interval;
  }
});

// ── Toggle monitoring ──
toggleEnabled.addEventListener('change', () => {
  const enabled = toggleEnabled.checked;
  chrome.runtime.sendMessage({
    type: 'toggle-enabled',
    enabled: enabled
  });
  updateStatusDot(enabled);
});

// ── Update poll interval ──
let intervalDebounce = null;
pollIntervalInput.addEventListener('input', () => {
  clearTimeout(intervalDebounce);
  intervalDebounce = setTimeout(() => {
    const val = parseInt(pollIntervalInput.value, 10);
    if (val >= 100 && val <= 2000) {
      chrome.runtime.sendMessage({
        type: 'set-interval',
        interval: val
      });
    }
  }, 500);
});

// ── Open texthooker page ──
openTexthooker.addEventListener('click', () => {
  chrome.tabs.create({ url: 'texthooker.html' });
  window.close();
});

// ── UI helpers ──
function updateStatusDot(enabled) {
  if (enabled) {
    statusDot.classList.remove('inactive');
  } else {
    statusDot.classList.add('inactive');
  }
}
