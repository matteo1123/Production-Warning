// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToFocusMode",
    title: "Add to Focus Mode Quick Links",
    contexts: ["link"]
  });

  chrome.contextMenus.create({
    id: "saveAllTabsAsFocus",
    title: "Save All Tabs as New Focus",
    contexts: ["page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToFocusMode") {
    const linkUrl = info.linkUrl;
    const linkText = info.linkText || new URL(linkUrl).hostname;

    // Get existing focus mode data
    chrome.storage.sync.get(['focusMode'], function (result) {
      const focusMode = result.focusMode || { links: [] };

      // Add new link if we haven't reached the limit
      if (!focusMode.links) focusMode.links = [];

      if (focusMode.links.length < 8) {
        focusMode.links.push({
          key: linkText,
          value: linkUrl
        });

        // Save updated focus mode data
        chrome.storage.sync.set({ focusMode }, () => {
          // Show notification
          chrome.action.setBadgeText({ text: "+" });
          chrome.action.setBadgeBackgroundColor({ color: "#cc0000" });

          // Clear badge after 2 seconds
          setTimeout(() => {
            chrome.action.setBadgeText({ text: "" });
          }, 2000);
        });
      }
    });
  }

  if (info.menuItemId === "saveAllTabsAsFocus") {
    // Query all tabs in the current window
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      // Filter out chrome:// and extension pages
      const validTabs = tabs.filter(t =>
        t.url &&
        !t.url.startsWith('chrome://') &&
        !t.url.startsWith('chrome-extension://') &&
        !t.url.startsWith('about:')
      );

      if (validTabs.length === 0) {
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#cc0000" });
        setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
        return;
      }

      // Inject a prompt dialog into the current tab to get the focus name
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (tabCount) => {
          return prompt(`Enter a name for this focus (${tabCount} tabs):`);
        },
        args: [validTabs.length]
      }).then((results) => {
        const focusName = results[0]?.result;

        if (!focusName || focusName.trim() === '') {
          return; // User cancelled or entered empty name
        }

        // Create links from all tabs (limit to 8)
        const links = validTabs.slice(0, 8).map(t => ({
          key: t.title || new URL(t.url).hostname,
          value: t.url
        }));

        // Get existing focus mode data and add new focus
        chrome.storage.sync.get(['focusMode'], function (result) {
          const focusMode = result.focusMode || { enabled: false, focuses: [] };

          if (!focusMode.focuses) {
            focusMode.focuses = [];
          }

          // Check if we've reached max focuses (10)
          if (focusMode.focuses.length >= 10) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => alert('Maximum of 10 focus topics reached. Please delete one first.')
            });
            return;
          }

          // Add new focus
          const newFocus = {
            name: focusName.trim(),
            links: links,
            active: false
          };

          focusMode.focuses.push(newFocus);

          // Save updated focus mode data
          chrome.storage.sync.set({ focusMode }, () => {
            // Show success badge
            chrome.action.setBadgeText({ text: "✓" });
            chrome.action.setBadgeBackgroundColor({ color: "#00cc00" });

            setTimeout(() => {
              chrome.action.setBadgeText({ text: "" });
            }, 2000);
          });
        });
      }).catch(err => {
        console.error('Failed to prompt for focus name:', err);
      });
    });
  }
}); 