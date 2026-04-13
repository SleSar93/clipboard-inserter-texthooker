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

    // Regular page — insert directly into body
    const p = document.createElement('p');
    p.className = 'clipboard-inserter-text';
    p.textContent = text;

    const target = document.getElementById('textlog')
      || document.getElementById('text')
      || document.body;

    target.appendChild(p);
    document.documentElement.scrollTop = document.documentElement.scrollHeight;
  }
})();
