// Jahdar - Background Service Worker (Manifest V3)

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-jahdar') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;
    triggerJahdarOnTab(tab.id);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'TRIGGER_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab && tab.id) {
        triggerJahdarOnTab(tab.id);
        sendResponse({ success: true, tabId: tab.id });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true; // Keep sendResponse open for async
  }
});

function triggerJahdarOnTab(tabId) {
  // First attempt: send message to content script
  chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_JAHDAR' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script not loaded on this tab yet, dynamically inject it
      chrome.scripting.executeScript(
        {
          target: { tabId },
          files: ['dist/content.js'],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error('Jahdar injection failed:', chrome.runtime.lastError.message);
            return;
          }
          // After injecting, send toggle message
          chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_JAHDAR' });
        }
      );
    }
  });
}
