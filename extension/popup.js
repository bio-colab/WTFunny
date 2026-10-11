// Jahdar Extension - Popup Logic

document.addEventListener('DOMContentLoaded', async () => {
  const domainEl = document.getElementById('tabDomain');
  const launchBtn = document.getElementById('launchBtn');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        domainEl.textContent = 'صفحة نظام محمية';
        launchBtn.disabled = true;
        launchBtn.style.opacity = '0.5';
        launchBtn.style.cursor = 'not-allowed';
        return;
      }

      try {
        const u = new URL(tab.url);
        domainEl.textContent = u.hostname + (u.pathname !== '/' ? u.pathname.substring(0, 18) + '...' : '');
      } catch {
        domainEl.textContent = tab.title || 'الصفحة الحالية';
      }
    } else {
      domainEl.textContent = 'صفحة نشطة غير معروفة';
    }
  } catch (err) {
    domainEl.textContent = 'الصفحة الحالية';
  }

  launchBtn.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ action: 'TRIGGER_ACTIVE_TAB' }, () => {
      window.close();
    });
  });
});
