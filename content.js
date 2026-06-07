// Clipboard Inserter - Content Script
// Injected into all pages. Only acts on the dedicated texthooker page
// (identified by the presence of #clipboard-inserter-container).

(function () {
  'use strict';

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'clipboard-inserter-text') {
      insertText(message.text);
    }
  });

  function insertText(text) {
    if (!text || text.trim() === '') return;

    const container = document.getElementById('clipboard-inserter-container');

    if (container) {
      // Texthooker page — dispatch event for the page's own JS to handle
      document.dispatchEvent(new CustomEvent('clipboard-inserter-text', {
        detail: { text: text }
      }));
    }
    // Not the texthooker page — do nothing.
  }
})();
