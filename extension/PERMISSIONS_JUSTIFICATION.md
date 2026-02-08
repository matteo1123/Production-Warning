# Chrome Web Store - Permission Justifications

Copy and paste these into the relevant fields during your submission.

## 1. Single Purpose Description
**To help developers manage their environment context by displaying safety warnings and relevant resources based on the current URL.**

---

## 2. Permission Justifications

### Host Permissions (Matches: `<all_urls>`)
> **Start with this:**
> "The extension must read the URL of every visited page to perform its two core functions:
> 1. **Safety**: To check if the URL matches a user-defined 'Production' rule and apply warning styles.
> 2. **Focus**: To check if the URL matches a 'Focus Mode' rule and display the context bar.
> 
> Because users can define rules for ANY internal or external domain (e.g. localhost, Salesforce, private intranets, public sites), we cannot restrict this to a specific list of sites in the manifest."

### Scripting (`scripting`)
> "Used for the 'AI Context Chat' feature. When a user asks a question, the extension uses scripting to extract the text content of the user's *currently open* Focus tabs to provide an answer. Also used to inject simple UI prompts (like 'Enter Focus Name') when saving a group of tabs."

### Tabs (`tabs`)
> "Required for the 'Save All Tabs' feature, which allows users to instantly save their current open tabs as a new 'Focus Mode'. It is also used to identify which open tabs match the user's current Focus Topic so the AI can answer questions based on the correct context."

### Storage (`storage`)
> "Required to save the user's configuration locally, including their defined Warning Rules (patterns and colors), Focus Modes (lists of links), and user preferences. No data is sent to external servers unless the user explicitly uses the 'Share' or 'Chat' features."

### Context Menus (`contextMenus`)
> "Provides quick access to core features via right-click: 'Add this page to Focus', 'Save all tabs as Focus', and 'Add link to Focus'. This allows users to build their workspaces without leaving their current flow."
