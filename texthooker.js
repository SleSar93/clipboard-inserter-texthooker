// ══════════════════════════════════════════════
// Texthooker Page - Script (extension page version)
// Receives text via content script CustomEvents only.
// No runtime messages — prevents double display.
// ══════════════════════════════════════════════

(function () {
  'use strict';

  // ── DOM Elements ──
  const container = document.getElementById('clipboard-inserter-container');
  const lineCounter = document.getElementById('line-counter');
  const charCounter = document.getElementById('char-counter');
  const btnSettings = document.getElementById('btn-settings');
  const btnExport = document.getElementById('btn-export');
  const btnClear = document.getElementById('btn-clear');
  const settingsPanel = document.getElementById('settings-panel');
  const fontSizeSlider = document.getElementById('font-size');
  const fontSizeValue = document.getElementById('font-size-value');
  const lineHeightSlider = document.getElementById('line-height');
  const lineHeightValue = document.getElementById('line-height-value');
  const fontFamilySelect = document.getElementById('font-family');
  const autoScrollToggle = document.getElementById('auto-scroll');

  // ── State ──
  let totalLines = 0;
  let totalChars = 0;
  let autoScroll = true;

  // Load settings first so they're applied to incoming text
  loadSettings();

  // ══════════════════════════════════════════════
  // Text Insertion
  // ══════════════════════════════════════════════

  function addTextEntry(text) {
    if (!text || text.trim() === '') return;

    const p = document.createElement('p');
    p.className = 'clipboard-inserter-text';
    p.textContent = text;

    // Apply current settings immediately
    p.style.fontSize = fontSizeSlider.value + 'px';
    p.style.lineHeight = lineHeightSlider.value;
    p.style.fontFamily = fontFamilySelect.value;

    container.appendChild(p);

    totalLines++;
    totalChars += text.length;
    updateCounters();

    if (autoScroll) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  function updateCounters() {
    lineCounter.textContent = `${totalLines} line${totalLines !== 1 ? 's' : ''}`;
    charCounter.textContent = `${totalChars.toLocaleString()} char${totalChars !== 1 ? 's' : ''}`;
  }

  // ══════════════════════════════════════════════
  // Listen for text from the content script
  // (content script injects into this page and fires CustomEvents)
  // ══════════════════════════════════════════════

  document.addEventListener('clipboard-inserter-text', (e) => {
    if (e.detail && e.detail.text) {
      addTextEntry(e.detail.text);
    }
  });

  // ══════════════════════════════════════════════
  // Settings
  // ══════════════════════════════════════════════

  btnSettings.addEventListener('click', () => {
    settingsPanel.classList.toggle('open');
    btnSettings.classList.toggle('active');
  });

  fontSizeSlider.addEventListener('input', () => {
    const size = fontSizeSlider.value;
    fontSizeValue.textContent = size + 'px';
    document.querySelectorAll('.clipboard-inserter-text').forEach(el => {
      el.style.fontSize = size + 'px';
    });
    saveSetting('fontSize', size);
  });

  lineHeightSlider.addEventListener('input', () => {
    const lh = lineHeightSlider.value;
    lineHeightValue.textContent = lh;
    document.querySelectorAll('.clipboard-inserter-text').forEach(el => {
      el.style.lineHeight = lh;
    });
    saveSetting('lineHeight', lh);
  });

  fontFamilySelect.addEventListener('change', () => {
    const ff = fontFamilySelect.value;
    document.querySelectorAll('.clipboard-inserter-text').forEach(el => {
      el.style.fontFamily = ff;
    });
    saveSetting('fontFamily', ff);
  });

  autoScrollToggle.addEventListener('change', () => {
    autoScroll = autoScrollToggle.checked;
    saveSetting('autoScroll', autoScroll);
  });

  // ══════════════════════════════════════════════
  // Actions
  // ══════════════════════════════════════════════

  btnClear.addEventListener('click', () => {
    const entries = container.querySelectorAll('.clipboard-inserter-text');
    if (entries.length === 0) return;
    if (confirm('Clear all text? This cannot be undone.')) {
      entries.forEach(el => el.remove());
      totalLines = 0;
      totalChars = 0;
      updateCounters();
    }
  });

  btnExport.addEventListener('click', () => {
    const entries = container.querySelectorAll('.clipboard-inserter-text');
    if (entries.length === 0) { alert('No text to export.'); return; }

    const lines = Array.from(entries).map(el => el.textContent);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    a.download = `texthooker_${now.toISOString().slice(0,10)}_${now.toTimeString().slice(0,5).replace(':','-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ══════════════════════════════════════════════
  // Persistence
  // ══════════════════════════════════════════════

  function saveSetting(key, value) {
    try {
      const s = JSON.parse(localStorage.getItem('texthooker-settings') || '{}');
      s[key] = value;
      localStorage.setItem('texthooker-settings', JSON.stringify(s));
    } catch (e) {}
  }

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('texthooker-settings') || '{}');
      if (s.fontSize)    { fontSizeSlider.value = s.fontSize;       fontSizeValue.textContent = s.fontSize + 'px'; }
      if (s.lineHeight)  { lineHeightSlider.value = s.lineHeight;   lineHeightValue.textContent = s.lineHeight; }
      if (s.fontFamily)  { fontFamilySelect.value = s.fontFamily; }
      if (s.autoScroll !== undefined) { autoScroll = s.autoScroll;  autoScrollToggle.checked = autoScroll; }
    } catch (e) {}
  }

  // ══════════════════════════════════════════════
  // Keyboard Shortcuts
  // ══════════════════════════════════════════════

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'Delete') { e.preventDefault(); btnClear.click(); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); btnExport.click(); }
    if (e.key === 'Escape' && settingsPanel.classList.contains('open')) {
      settingsPanel.classList.remove('open');
      btnSettings.classList.remove('active');
    }
  });

})();
