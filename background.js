// Clipboard Inserter - Background Service Worker
let isEnabled = false;
let lastClipboardText = '';
let creatingOffscreen = null;

// ── Persistence: Load state on startup ──
chrome.storage.local.get(['enabled'], (result) => {
  isEnabled = !!result.enabled;
  updateBadge();
  if (isEnabled) {
    startMonitoring();
  }
});

// ── Icon Click = Toggle ON/OFF ──
chrome.action.onClicked.addListener(async () => {
  isEnabled = !isEnabled;
  await chrome.storage.local.set({ enabled: isEnabled });

  if (isEnabled) {
    await startMonitoring();
  } else {
    stopMonitoring();
  }
  updateBadge();
});

function updateBadge() {
  const text = isEnabled ? 'ON' : '';
  const color = isEnabled ? '#22c55e' : '';
  const title = `Clipboard Inserter (${isEnabled ? 'ON' : 'OFF'}) - Click to toggle`;

  chrome.action.setBadgeText({ text });
  if (isEnabled) chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setTitle({ title });
}

// ── Context Menu ──
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-texthooker',
    title: 'Open Texthooker Page',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'open-texthooker') {
    chrome.tabs.create({ url: 'texthooker.html' });
  }
});

// ── Offscreen Document Management ──
async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [offscreenUrl]
    });
    if (contexts.length > 0) return;
  } catch (e) {}

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  try {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Monitor clipboard for text insertion'
    });
    await creatingOffscreen;
  } catch (e) {
    console.error('Offscreen creation error:', e.message);
  } finally {
    creatingOffscreen = null;
  }
}

function handleClipboardText(text) {
  if (!isEnabled || !text || text.trim() === '' || text === lastClipboardText) return;
  lastClipboardText = text;

  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'clipboard-inserter-text',
        text: text
      }).catch(() => {});
    }
  });
}

// ── Message Handling ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'clipboard-data':
      handleClipboardText(message.text);
      break;
    case 'get-status':
      sendResponse({ enabled: isEnabled });
      return true;
  }
});

async function startMonitoring() {
  await ensureOffscreenDocument();
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: 'start-monitoring' }).catch(() => {});
  }, 200);
}

function stopMonitoring() {
  chrome.runtime.sendMessage({ type: 'stop-monitoring' }).catch(() => {});
}