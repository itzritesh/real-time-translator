// CSS Injection for Webpage Translation Overlay
const style = document.createElement('style');
style.textContent = `
  .auratranslate-overlay {
    position: fixed;
    z-index: 999999;
    max-width: 340px;
    background: rgba(10, 11, 16, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    color: #f8fafc;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    pointer-events: auto;
    animation: auraFadeIn 0.25s ease-out;
  }

  .auratranslate-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 8px;
    margin-bottom: 10px;
  }

  .auratranslate-logo {
    font-weight: 700;
    color: #6366f1;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .auratranslate-close {
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
  }

  .auratranslate-close:hover {
    color: #f8fafc;
  }

  .auratranslate-body {
    margin-bottom: 12px;
  }

  .auratranslate-original {
    font-size: 12px;
    color: #94a3b8;
    font-style: italic;
    margin-bottom: 6px;
    max-height: 50px;
    overflow-y: auto;
  }

  .auratranslate-translation {
    font-size: 15px;
    font-weight: 500;
    color: #10b981;
  }

  .auratranslate-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 8px;
    font-size: 11px;
    color: #64748b;
  }

  .auratranslate-actions {
    display: flex;
    gap: 8px;
  }

  .auratranslate-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 11px;
    padding: 2px 4px;
    text-decoration: underline;
  }

  .auratranslate-btn:hover {
    color: #f8fafc;
  }

  @keyframes auraFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;
document.head.appendChild(style);

let activeOverlay = null;

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showLoading") {
    createOverlay("Translating selection...", message.x, message.y, true);
  } else if (message.action === "showTranslation") {
    updateOverlay(message.original, message.translation, message.score);
  } else if (message.action === "showError") {
    showErrorOverlay(message.message);
  }
});

function createOverlay(text, x, y, isLoading = false) {
  // Clear any existing overlay
  if (activeOverlay) {
    activeOverlay.remove();
  }

  const overlay = document.createElement('div');
  overlay.className = 'auratranslate-overlay';
  
  // Center overlay near viewport if coordinates are skewed
  overlay.style.top = '100px';
  overlay.style.right = '20px';

  overlay.innerHTML = `
    <div class="auratranslate-header">
      <span class="auratranslate-logo">AuraTranslate</span>
      <button class="auratranslate-close" id="aura-close-btn">&times;</button>
    </div>
    <div class="auratranslate-body">
      <div class="auratranslate-translation" id="aura-translate-body">${text}</div>
    </div>
  `;

  document.body.appendChild(overlay);
  activeOverlay = overlay;

  document.getElementById('aura-close-btn').addEventListener('click', () => {
    overlay.remove();
    activeOverlay = null;
  });
}

function updateOverlay(original, translation, score) {
  if (!activeOverlay) {
    createOverlay("", 0, 0, false);
  }

  const bodyEl = activeOverlay.querySelector('.auratranslate-body');
  
  bodyEl.innerHTML = `
    <div class="auratranslate-original">"${original}"</div>
    <div class="auratranslate-translation">${translation}</div>
  `;

  const footer = document.createElement('div');
  footer.className = 'auratranslate-footer';
  footer.innerHTML = `
    <span>Accuracy: ${score || 95}%</span>
    <div class="auratranslate-actions">
      <button class="auratranslate-btn" id="aura-copy-btn">Copy</button>
      <button class="auratranslate-btn" id="aura-speak-btn">Speak</button>
    </div>
  `;

  activeOverlay.appendChild(footer);

  // Copy Action
  document.getElementById('aura-copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(translation).then(() => {
      document.getElementById('aura-copy-btn').innerText = 'Copied!';
      setTimeout(() => {
        document.getElementById('aura-copy-btn').innerText = 'Copy';
      }, 1500);
    });
  });

  // Speak Action
  document.getElementById('aura-speak-btn').addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(translation);
      window.speechSynthesis.speak(utterance);
    }
  });
}

function showErrorOverlay(msg) {
  if (!activeOverlay) {
    createOverlay(msg, 0, 0, false);
  } else {
    const translationEl = activeOverlay.querySelector('.auratranslate-translation');
    if (translationEl) {
      translationEl.style.color = '#ef4444';
      translationEl.innerText = msg;
    }
  }
}
