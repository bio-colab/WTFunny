// Jahdar - Background Service Worker (Manifest V3)

function isScriptableUrl(url) {
  if (!url) return false;
  return !/^(chrome|edge|about|chrome-extension|brave|opera):\/\//i.test(url) &&
         !url.includes('chrome.google.com/webstore') &&
         !url.includes('chromewebstore.google.com');
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-jahdar') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;
    triggerJahdarOnTab(tab);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'TRIGGER_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab && tab.id) {
        triggerJahdarOnTab(tab);
        sendResponse({ success: true, tabId: tab.id });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true; // Keep sendResponse open for async
  }
});

function triggerJahdarOnTab(tab) {
  const tabId = tab.id;
  const url = tab.url || '';

  if (!isScriptableUrl(url)) {
    console.warn('جَحْدَر: لا يمكن تشغيل الإضافة على صفحات النظام المحمية:', url);
    return;
  }

  // First attempt: send message to content script
  chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_JAHDAR' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script not yet present or tab was opened before extension was loaded/updated.
      // Dynamically inject content.js:
      chrome.scripting.executeScript(
        {
          target: { tabId },
          files: ['dist/content.js'],
        },
        () => {
          if (chrome.runtime.lastError) {
            console.warn('ملاحظة حقن جَحْدَر:', chrome.runtime.lastError.message);
            return;
          }
          // After injection, trigger launch
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_JAHDAR' });
          }, 80);
        }
      );
    }
  });
}
