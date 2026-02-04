# PW Focus - Chrome Web Store Permission Justifications

This document contains the permission justifications required for Chrome Web Store submission.

---

## Permission: `storage`

**Why is this permission necessary?**

The storage permission is required to persist user preferences and focus configurations across browser sessions. The extension stores:

- Focus mode enabled/disabled state
- User-created focus topics (up to 10) with their associated quick links (up to 8 per focus)
- Warning rule configurations for production environment visibility
- Context notes attached to specific URLs
- User's data sharing consent preference

Without storage, users would lose all their configurations each time they close the browser. We use `chrome.storage.sync` to enable cross-device synchronization for users signed into Chrome.

---

## Permission: `contextMenus`

**Why is this permission necessary?**

The contextMenus permission enables right-click menu integration that is core to the extension's workflow. Users can:

- Right-click any link and select "Add to Focus Mode Quick Links" to capture it
- Right-click on a page and select "Add This Page to Focus" to add the current page
- Right-click on a page and select "Save All Tabs as New Focus" to create a new focus from all open tabs

These context menu actions provide quick, seamless ways to build focus collections without leaving the user's current workflow.

---

## Permission: `tabs`

**Why is this permission necessary?**

The tabs permission is required for two key features:

1. **Save All Tabs as Focus**: When users choose to save all open tabs as a new focus, we need to query `chrome.tabs.query()` to get the URLs and titles of all open tabs.

2. **AI Chat (Ask Focus)**: The chat feature allows users to ask questions about content in their focus tabs. We need to identify which open tabs match the user's current focus links so we can extract relevant content for the AI to analyze.

We only read tab URLs and titles; we do not modify, close, or navigate tabs.

---

## Permission: `scripting`

**Why is this permission necessary?**

The scripting permission enables core functionality:

1. **Content Extraction for AI Chat**: When users ask questions via "Ask Focus", we inject a content extraction script into matching tabs to gather page text for AI analysis. This content never leaves the user's device except when they explicitly use the chat feature AND have opted in to data sharing.

2. **User Feedback Alerts**: We inject simple alert dialogs to provide feedback when users perform context menu actions (e.g., "Link added!" or "Maximum links reached").

We only inject scripts into tabs the user has explicitly opened; we never inject into arbitrary websites.

---

## Host Permission: `<all_urls>`

**Why is this permission necessary?**

The `<all_urls>` host permission is required for the following core features:

1. **Focus Bar Overlay**: The content script injects a persistent focus bar at the top of every page showing the current focus and quick links. This helps users stay focused across all websites they visit.

2. **Cursor Warning System**: Users can configure warning rules that display visual alerts when hovering over elements on production/sensitive sites. This requires the content script to run on any URL the user configures.

3. **Context Notes**: Users can attach notes to specific URL patterns and view them on any matching page.

4. **Focus Share Import**: When visiting pwfocus.net (our focus sharing website), the content script detects shared focuses and enables one-click import.

**Data handling:** The extension does not collect, transmit, or store URLs or browsing data except:
- URLs explicitly added by the user to their focus links
- Page content extracted for AI chat (only when user initiates a chat query AND has enabled data sharing)

---

## Data Disclosure Summary

| Data Type | Collected? | Transmitted? | User Consent |
|-----------|------------|--------------|--------------|
| Browsing history | No | No | N/A |
| URLs in focus links | Yes (user-initiated) | Only when sharing | Explicit opt-in |
| Page content | Yes (for AI chat) | Yes (to AI service) | Explicit opt-in |
| Personal information | No | No | N/A |
| Financial information | No | No | N/A |
| Authentication info | No | No | N/A |
| User activity | No | No | N/A |
| Website content | Extracted on-demand | Only for AI chat | Explicit opt-in |

Users must explicitly enable "AI Chat & Focus Sharing" in settings before any data is transmitted to external services.
