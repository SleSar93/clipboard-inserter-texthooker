// Clipboard Inserter - Background Service Worker
// Click the extension icon to toggle monitoring ON/OFF.
// OFF by default. Sends clipboard text to the ACTIVE tab only.

let isEnabled = false;
let lastClipboardText = '';
let creatingOffscreen = null;

// ──────────────────────────────────────────────
// Icon Click = Toggle ON/OFF
// ──────────────────────────────────────────────

chrome.action.onClicked.addListener(async () => {
  isEnabled = !isEnabled;
  chrome.storage.local.set({ enabled: isEnabled });

  if (isEnabled) {
    await startMonitoring();
  } else {
    stopMonitoring();
  }

  updateBadge();
});

// ──────────────────────────────────────────────
// Badge & Title
// ──────────────────────────────────────────────

function updateBadge() {
  if (isEnabled) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
    chrome.action.setTitle({ title: 'Clipboard Inserter (ON) - Click to toggle' });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'Clipboard Inserter (OFF) - Click to toggle' });
  }
}

// ──────────────────────────────────────────────
// Context Menu (right-click the icon)
// ──────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-texthooker',
    title: 'Open Texthooker Page',
    contexts: ['action']   // only in the extension icon right-click menu
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'open-texthooker') {
    chrome.tabs.create({ url: 'texthooker.html' });
  }
});

// ──────────────────────────────────────────────
// Offscreen Document Management
// ──────────────────────────────────────────────

async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');

  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [offscreenUrl]
    });
    if (contexts.length > 0) return;
  } catch (e) {
    // getContexts may not be available in older versions
  }

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  try {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Monitor clipboard for new text to insert into the active tab'
    });
    await creatingOffscreen;
  } catch (e) {
    console.log('Offscreen document creation:', e.message);
  } finally {
    creatingOffscreen = null;
  }
}

// ──────────────────────────────────────────────
// Clipboard Text Handling
// ──────────────────────────────────────────────

function handleClipboardText(text) {
  if (!isEnabled) return;
  if (!text || text.trim() === '') return;
  if (text === lastClipboardText) return;

  lastClipboardText = text;

  // Broadcast to all tabs. The content script will filter non-texthooker pages out.
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'clipboard-inserter-text',
        text: text
      }).catch(() => {});
    }
  });
}


// ──────────────────────────────────────────────
// Message Handling
// ──────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'clipboard-data':
      // Received from offscreen document
      handleClipboardText(message.text);
      break;

    case 'get-status':
      sendResponse({ enabled: isEnabled });
      return true;
  }
});

// ──────────────────────────────────────────────
// Monitoring Control
// ──────────────────────────────────────────────

async function startMonitoring() {
  await ensureOffscreenDocument();
  // Small delay to let the offscreen document initialize
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: 'start-monitoring' }).catch(() => {});
  }, 200);
}

function stopMonitoring() {
  chrome.runtime.sendMessage({ type: 'stop-monitoring' }).catch(() => {});
}

// ──────────────────────────────────────────────
// Initialization — always start OFF
// ──────────────────────────────────────────────

function initialize() {
  isEnabled = false;
  chrome.storage.local.set({ enabled: false });
  updateBadge();
}

chrome.runtime.onStartup.addListener(() => {
  initialize();
});

// Initialize immediately
initialize();
