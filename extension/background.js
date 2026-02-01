// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToFocusMode",
    title: "Add to Focus Mode Quick Links",
    contexts: ["link"]
  });

  chrome.contextMenus.create({
    id: "addPageToFocus",
    title: "Add This Page to Focus",
    contexts: ["page"]
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

  if (info.menuItemId === "addPageToFocus") {
    // Add current page to the active focus
    chrome.storage.sync.get(['focusMode'], function (result) {
      const focusMode = result.focusMode || { enabled: false, focuses: [] };

      // Find active focus
      const activeIndex = focusMode.focuses?.findIndex(f => f.active);
      if (activeIndex === -1 || activeIndex === undefined) {
        // No active focus - show error
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => alert('No active focus. Please enable a focus first.')
        });
        return;
      }

      const activeFocus = focusMode.focuses[activeIndex];
      if (!activeFocus.links) activeFocus.links = [];

      // Check limit
      if (activeFocus.links.length >= 8) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => alert('Maximum of 8 links per focus reached.')
        });
        return;
      }

      // Add the current page
      activeFocus.links.push({
        key: tab.title || new URL(tab.url).hostname,
        value: tab.url
      });

      focusMode.focuses[activeIndex] = activeFocus;

      chrome.storage.sync.set({ focusMode }, () => {
        chrome.action.setBadgeText({ text: "+" });
        chrome.action.setBadgeBackgroundColor({ color: "#00cc00" });
        setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
      });
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

// Convex API configuration (no cold starts!)
const CONVEX_URL = 'https://strong-ferret-346.convex.cloud';

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_FOCUS_CONTENT') {
    handleFocusChatRequest(message.question)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }
});

/**
 * Handle a chat request by extracting content from focus tabs and calling the AI API
 */
async function handleFocusChatRequest(question) {
  try {
    // Get current focus configuration
    const { focusMode } = await chrome.storage.sync.get(['focusMode']);

    if (!focusMode || !focusMode.enabled) {
      return { error: 'Focus mode is not enabled. Please enable focus mode first.' };
    }

    // Find the active focus
    const activeFocus = focusMode.focuses?.find(f => f.active);
    if (!activeFocus) {
      return { error: 'No active focus found. Please select a focus first.' };
    }

    // Get all focus URLs (normalized)
    const focusUrls = (activeFocus.links || []).map(link => {
      let url = link.value;
      if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
      }
      return url.toLowerCase();
    });

    if (focusUrls.length === 0) {
      return { error: 'No links defined in this focus.' };
    }

    // Query all open tabs
    const allTabs = await chrome.tabs.query({ currentWindow: true });

    // Filter to tabs that match focus URLs
    const matchingTabs = allTabs.filter(tab => {
      if (!tab.url) return false;
      const tabUrl = tab.url.toLowerCase();

      // Check if tab URL matches any focus URL (partial match)
      return focusUrls.some(focusUrl => {
        try {
          const focusUrlObj = new URL(focusUrl);
          const tabUrlObj = new URL(tabUrl);

          // Match by hostname (domain)
          return tabUrlObj.hostname.includes(focusUrlObj.hostname) ||
            focusUrlObj.hostname.includes(tabUrlObj.hostname);
        } catch {
          // Simple string match fallback
          return tabUrl.includes(focusUrl) || focusUrl.includes(tabUrl);
        }
      });
    });

    if (matchingTabs.length === 0) {
      return {
        error: `No open tabs match your current focus "${activeFocus.name}". Please open some of your focus links first.`
      };
    }

    // Extract content from each matching tab
    const extractedContents = [];

    for (const tab of matchingTabs) {
      try {
        // Skip chrome:// and other restricted URLs
        if (tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:') ||
          tab.url.startsWith('edge://')) {
          continue;
        }

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Extract text content inline to ensure return value works
            const skipSelectors = [
              'nav', 'header', 'footer', 'aside',
              'script', 'style', 'noscript', 'iframe',
              '.nav', '.navbar', '.header', '.footer', '.sidebar',
              '.ad', '.ads', '.advertisement'
            ];

            const body = document.body;
            if (!body) {
              return { url: window.location.href, title: document.title, content: '', charCount: 0 };
            }

            const clone = body.cloneNode(true);
            skipSelectors.forEach(selector => {
              try {
                clone.querySelectorAll(selector).forEach(el => el.remove());
              } catch (e) { }
            });

            let text = clone.innerText || clone.textContent || '';
            text = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();

            // Truncate to ~4000 chars
            if (text.length > 4000) {
              text = text.substring(0, 4000) + '... [truncated]';
            }

            return {
              url: window.location.href,
              title: document.title || 'Untitled',
              content: text,
              charCount: text.length
            };
          }
        });

        if (results && results[0] && results[0].result && results[0].result.content) {
          extractedContents.push(results[0].result);
        }
      } catch (err) {
        console.warn(`Could not extract from tab ${tab.id} (${tab.url}):`, err.message);
        // Continue with other tabs
      }
    }

    if (extractedContents.length === 0) {
      // Provide more helpful error message
      return {
        error: `Could not extract content from ${matchingTabs.length} matching tab(s). The pages may be restricted or still loading. Try refreshing the tabs and trying again.`
      };
    }

    // Combine all extracted content
    const combinedContent = extractedContents.map(content =>
      `=== ${content.title} ===\nURL: ${content.url}\n\n${content.content}`
    ).join('\n\n---\n\n');

    // Call Convex action via HTTP API (no cold starts!)
    const response = await fetch(`${CONVEX_URL}/api/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'chat:askFocus',
        args: {
          question: question,
          content: combinedContent,
          focusName: activeFocus.name,
          tabCount: extractedContents.length
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Debug logging
    console.log('Convex response:', JSON.stringify(data, null, 2));

    // Convex wraps the response in a 'value' field
    if (data.value?.error) {
      return { error: data.value.error };
    }

    // Handle various response formats
    if (data.value?.answer) {
      return { answer: data.value.answer };
    }
    if (data.answer) {
      return { answer: data.answer };
    }
    if (data.value && typeof data.value === 'string') {
      return { answer: data.value };
    }

    // If we got here, log the issue
    console.error('Unexpected Convex response format:', data);
    return { error: 'Unexpected response format from API. Check console for details.' };

  } catch (error) {
    console.error('Focus chat error:', error);
    return { error: error.message || 'An unexpected error occurred' };
  }
}