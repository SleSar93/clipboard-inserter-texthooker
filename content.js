// Clipboard Inserter - Content Script
// Injected into all pages. Two behaviors:
//   - If the page has #clipboard-inserter-container (texthooker page),
//     only dispatch a CustomEvent and let the page's own JS handle insertion.
//   - Otherwise, insert text directly as <p> elements.

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
      // Page has its own handler — just signal it, don't insert
      document.dispatchEvent(new CustomEvent('clipboard-inserter-text', {
        detail: { text: text }
      }));
      return;
    }

    const legacyContainer = document.getElementById('textlog') || document.getElementById('text');
    const hasMetaTag = document.querySelector('meta[name="clipboard-inserter"]');

    if (!legacyContainer && !hasMetaTag) {
      // Not a recognized texthooker page. Do nothing.
      return;
    }

    // Regular page identified as texthooker — insert directly
    const p = document.createElement('p');
    p.className = 'clipboard-inserter-text';
    p.textContent = text;

    const target = legacyContainer || document.body;
    target.appendChild(p);

    const scrollTarget = legacyContainer || document.documentElement;
    scrollTarget.scrollTop = scrollTarget.scrollHeight;
  }
})();
