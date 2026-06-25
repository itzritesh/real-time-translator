// Create right-click context menu item on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "auratranslate-selection",
    title: "Translate Selection with AuraTranslate",
    contexts: ["selection"]
  });
});

// Helper to safely send message. If content script is missing, dynamically inject it and retry.
function safeSendMessage(tab, message) {
  if (!tab || !tab.id) return;
  
  chrome.tabs.sendMessage(tab.id, message, async (response) => {
    if (chrome.runtime.lastError) {
      const errMsg = chrome.runtime.lastError.message;
      if (errMsg.includes("Receiving end does not exist")) {
        console.log("AuraTranslate: Content script is missing. Attempting automatic injection...");
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          });
          // Retry sending message after successful injection
          chrome.tabs.sendMessage(tab.id, message);
        } catch (injectErr) {
          console.warn("AuraTranslate: Cannot inject content script on this tab (e.g. system page/unsupported page). details:", injectErr.message);
        }
      } else {
        console.warn("AuraTranslate safeSendMessage warning: " + errMsg);
      }
    }
  });
}

// Listen for context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "auratranslate-selection") {
    const selectedText = info.selectionText;
    if (!selectedText || selectedText.trim() === '') return;

    // Send a temporary loading indicator message to content script safely
    safeSendMessage(tab, {
      action: "showLoading",
      x: info.x || 100,
      y: info.y || 100
    });

    try {
      // Call translation API on local server
      const response = await fetch('http://localhost:5065/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: selectedText,
          source: 'Auto-Detect',
          target: 'English', // default to English in context menu
          context: 'Casual'
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const data = await response.json();

      // Relay translation back to content script safely
      safeSendMessage(tab, {
        action: "showTranslation",
        original: selectedText,
        translation: data.best_translation,
        score: data.quality_score,
        notes: data.culture_notes
      });
    } catch (err) {
      console.error(err);
      safeSendMessage(tab, {
        action: "showError",
        message: "Failed to connect to local translation server. Please make sure server is running on http://localhost:5065"
      });
    }
  }
});
