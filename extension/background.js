// Create context menu items
chrome.runtime.onInstalled.addListener((details) => {
  // Show onboarding page for new installs
  if (details.reason === 'install') {
    chrome.storage.sync.get(['dataSharingConsent'], (result) => {
      if (result.dataSharingConsent === undefined) {
        // Open onboarding page to get user consent
        chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
      }
    });
  }

  // Create context menus (runs on install and update)
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

          // Deactivate all existing focuses
          focusMode.focuses.forEach(f => f.active = false);

          // Add new focus and set it as active
          const newFocus = {
            name: focusName.trim(),
            links: links,
            active: true,
            warning: { enabled: false, emblem: 'production', elementRegex: '.*', urlRegex: '*' },
            contextNotes: []
          };

          focusMode.focuses.push(newFocus);

          // Enable focus mode
          focusMode.enabled = true;

          // Save updated focus mode data
          chrome.storage.sync.set({ focusMode }, () => {
            // Show success badge
            chrome.action.setBadgeText({ text: "✓" });
            chrome.action.setBadgeBackgroundColor({ color: "#00cc00" });

            setTimeout(() => {
              chrome.action.setBadgeText({ text: "" });
            }, 2000);

            // Inject focus bar in all tabs
            chrome.tabs.query({}, (allTabs) => {
              allTabs.forEach(t => {
                if (t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://')) {
                  chrome.tabs.sendMessage(t.id, { type: 'FOCUS_MODE_CHANGED' }).catch(() => { });
                }
              });
            });
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

  if (message.type === 'COPY_FOCUS_CONTEXT') {
    extractFocusContext()
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'OPEN_FOCUS_PAGE') {
    chrome.runtime.openOptionsPage();
    return false;
  }

  if (message.type === 'OPEN_FOCUS_WINDOW') {
    const urls = message.urls;
    if (urls && urls.length > 0) {
      chrome.windows.create({ url: urls, focused: true });
    }
    return false;
  }
});

/**
 * Handle a chat request by extracting content from focus tabs and calling the AI API
 */
async function handleFocusChatRequest(question) {
  try {
    // Get consent preference (for whether to store messages in DB)
    const { dataSharingConsent } = await chrome.storage.sync.get(['dataSharingConsent']);
    const allowDataStorage = dataSharingConsent === true;

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

    // Get all focus links with metadata (preserving order)
    const focusLinks = (activeFocus.links || []).map(link => {
      let url = link.value;
      if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
      }
      return {
        url: url.toLowerCase(),
        label: link.key,
        context: link.context || '' // Context label for AI
      };
    });

    if (focusLinks.length === 0) {
      return { error: 'No links defined in this focus.' };
    }

    // Query all open tabs
    const allTabs = await chrome.tabs.query({ currentWindow: true });

    // Convert glob pattern to regex for exclusion matching
    function globToRegex(pattern) {
      let regex = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars except * and ?
        .replace(/\*/g, '.*')                  // * matches anything
        .replace(/\?/g, '.');                  // ? matches single char
      return new RegExp(regex, 'i');
    }

    // Check if URL should be excluded from context
    function shouldExcludeUrl(url, warning) {
      if (!warning || !warning.enabled || !warning.excludeFromContext) return false;
      try {
        const pattern = globToRegex(warning.urlRegex || '*');
        return pattern.test(url);
      } catch {
        return false;
      }
    }

    // Match tabs to focus links while preserving link order
    // Each link can match to one tab, processed in focus link order
    const orderedMatches = [];
    const usedTabIds = new Set();

    for (const focusLink of focusLinks) {
      // Find a tab that matches this focus link
      const matchingTab = allTabs.find(tab => {
        if (!tab.url || usedTabIds.has(tab.id)) return false;
        const tabUrl = tab.url.toLowerCase();

        // Check if this URL should be excluded from context
        if (shouldExcludeUrl(tab.url, activeFocus.warning)) {
          return false;
        }

        try {
          const focusUrlObj = new URL(focusLink.url);
          const tabUrlObj = new URL(tabUrl);

          // Match by hostname (domain)
          return tabUrlObj.hostname.includes(focusUrlObj.hostname) ||
            focusUrlObj.hostname.includes(tabUrlObj.hostname);
        } catch {
          // Simple string match fallback
          return tabUrl.includes(focusLink.url) || focusLink.url.includes(tabUrl);
        }
      });

      if (matchingTab) {
        usedTabIds.add(matchingTab.id);
        orderedMatches.push({
          tab: matchingTab,
          label: focusLink.label,
          context: focusLink.context
        });
      }
    }

    if (orderedMatches.length === 0) {
      return {
        error: `No open tabs match your current focus "${activeFocus.name}". Please open some of your focus links first.`
      };
    }

    // Extract content from each matching tab (in link order)
    const extractedContents = [];

    for (const match of orderedMatches) {
      const { tab, label, context } = match;
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
          extractedContents.push({
            ...results[0].result,
            label: label,
            context: context
          });
        }
      } catch (err) {
        console.warn(`Could not extract from tab ${tab.id} (${tab.url}):`, err.message);
        // Continue with other tabs
      }
    }

    if (extractedContents.length === 0) {
      // Provide more helpful error message
      return {
        error: `Could not extract content from ${orderedMatches.length} matching tab(s). The pages may be restricted or still loading. Try refreshing the tabs and trying again.`
      };
    }

    // Combine all extracted content (in link order with context labels)
    const combinedContent = extractedContents.map((content, index) => {
      const header = `=== Source ${index + 1}: ${content.label} ===`;
      const contextLine = content.context ? `Context: ${content.context}` : '';
      const urlLine = `URL: ${content.url}`;

      return [header, contextLine, urlLine, '', content.content]
        .filter(line => line !== '')
        .join('\n');
    }).join('\n\n---\n\n');

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
          tabCount: extractedContents.length,
          storeMessage: allowDataStorage  // Only store if user opted in
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    const data = await response.json();

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

    // If we got here, the response format was unexpected
    return { error: 'Unexpected response format from API. Please try again later.' };

  } catch (error) {
    console.error('Focus chat error:', error);
    return { error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Extract content from focus tabs without sending to AI (for clipboard copy)
 */
async function extractFocusContext() {
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

    // Get all focus links with metadata (preserving order)
    const focusLinks = (activeFocus.links || []).map(link => {
      let url = link.value;
      if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
      }
      return {
        url: url.toLowerCase(),
        label: link.key,
        context: link.context || ''
      };
    });

    if (focusLinks.length === 0) {
      return { error: 'No links defined in this focus.' };
    }

    // Query all open tabs
    const allTabs = await chrome.tabs.query({ currentWindow: true });

    // Convert glob pattern to regex for exclusion matching
    function globToRegex(pattern) {
      let regex = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars except * and ?
        .replace(/\*/g, '.*')                  // * matches anything
        .replace(/\?/g, '.');                  // ? matches single char
      return new RegExp(regex, 'i');
    }

    // Check if URL should be excluded from context
    function shouldExcludeUrl(url, warning) {
      if (!warning || !warning.enabled || !warning.excludeFromContext) return false;
      try {
        const pattern = globToRegex(warning.urlRegex || '*');
        return pattern.test(url);
      } catch {
        return false;
      }
    }

    // Match tabs to focus links while preserving link order
    const orderedMatches = [];
    const usedTabIds = new Set();

    for (const focusLink of focusLinks) {
      const matchingTab = allTabs.find(tab => {
        if (!tab.url || usedTabIds.has(tab.id)) return false;
        const tabUrl = tab.url.toLowerCase();

        // Check if this URL should be excluded from context
        if (shouldExcludeUrl(tab.url, activeFocus.warning)) {
          return false;
        }

        try {
          const focusUrlObj = new URL(focusLink.url);
          const tabUrlObj = new URL(tabUrl);
          return tabUrlObj.hostname.includes(focusUrlObj.hostname) ||
            focusUrlObj.hostname.includes(tabUrlObj.hostname);
        } catch {
          return tabUrl.includes(focusLink.url) || focusLink.url.includes(tabUrl);
        }
      });
      if (matchingTab) {
        usedTabIds.add(matchingTab.id);
        orderedMatches.push({
          tab: matchingTab,
          label: focusLink.label,
          context: focusLink.context
        });
      }
    }

    if (orderedMatches.length === 0) {
      return {
        error: `No open tabs match your current focus "${activeFocus.name}". Please open some of your focus links first.`
      };
    }

    // Extract content from each matching tab (in link order)
    const extractedContents = [];

    for (const match of orderedMatches) {
      const { tab, label, context } = match;
      try {
        if (tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:') ||
          tab.url.startsWith('edge://')) {
          continue;
        }

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
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

            // Allow more content for copy (8000 chars per page)
            if (text.length > 8000) {
              text = text.substring(0, 8000) + '... [truncated]';
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
          extractedContents.push({
            ...results[0].result,
            label: label,
            context: context
          });
        }
      } catch (err) {
        console.warn(`Could not extract from tab ${tab.id} (${tab.url}):`, err.message);
      }
    }

    if (extractedContents.length === 0) {
      return {
        error: `Could not extract content from ${orderedMatches.length} matching tab(s). The pages may be restricted or still loading.`
      };
    }

    // Combine all extracted content (in link order with context labels)
    const combinedContent = extractedContents.map((content, index) => {
      const header = `=== Source ${index + 1}: ${content.label} ===`;
      const contextLine = content.context ? `Context: ${content.context}` : '';
      const urlLine = `URL: ${content.url}`;

      return [header, contextLine, urlLine, '', content.content]
        .filter(line => line !== '')
        .join('\n');
    }).join('\n\n---\n\n');

    return {
      content: combinedContent,
      focusName: activeFocus.name,
      sourceCount: extractedContents.length
    };

  } catch (error) {
    console.error('Extract context error:', error);
    return { error: error.message || 'An unexpected error occurred' };
  }
}