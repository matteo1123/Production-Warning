# PW Focus Privacy Policy

**Effective Date:** February 8, 2026

## Overview

PW Focus ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Chrome extension.

## Information We Collect

### Local Data (Stored on Your Device)

PW Focus stores the following data **locally** on your device using Chrome's secure storage API:

- **Focus configurations**: Names, descriptions, and link collections you create
- **Warning rules**: URL patterns and element selectors for cursor warnings
- **Context notes**: Notes you attach to specific URLs
- **Settings**: Your preferences including data sharing consent

This data never leaves your device unless you explicitly choose to share a focus or use the AI features.

### Data Shared with External Services

**1. AI Chat Feature (Powered by Google Gemini)**
When you use the "Ask Focus" chat feature:

- **Page content** (text only) from your open focus tabs is extracted and sent to our backend (hosted on **Convex**).
- This data is then forwarded to **Google Gemini** (the AI model) to generate an answer.
- **Data Retention**:
    - If you **opt-in** to data collection: Your questions and page context may be stored to improve the service.
    - If you **opt-out**: Your data is processed ephemerally and not persisted after the answer is generated.

**2. Focus Sharing**
When you click "Share Active Focus":

- Focus name, links, and context notes are uploaded to our backend (**Convex**).
- A **publicly accessible link** (with a unique ID) is generated. Anyone with this link can view and import your focus.
- **Privacy Warning**: Do not share focuses that contain private URLs or sensitive notes if you do not want them to be accessible to others who have the link.

This only happens when you explicitly click the share button.

## What We Don't Collect

We do **NOT** collect:

- Your browsing history
- Passwords or authentication credentials
- Financial information
- Personal identifiers (name, email, etc.)
- Data from websites not in your active focus
- Cookies or session tokens that would allow us to impersonate you

**Important Clarification on Private Sites:**
PW Focus **cannot** log into websites on your behalf or access content behind authentication barriers that you haven't already unlocked. The extension only reads text that is currently visible in your browser window. If you are logged into a private site (like Salesforce, Jira, or internal tools), only the content visible to you as an authenticated user can be extracted when you explicitly use the AI chat feature.

## How We Use Your Information

- **Focus configurations**: To display your curated links and settings
- **Warning rules**: To show visual alerts on matching websites
- **Context notes**: To display your notes on matching pages
- **AI chat data**: To provide answers about your focus tab content (only when opted in)

## Data Security

- All local data is stored using Chrome's secure storage API
- Data shared with external services is transmitted over HTTPS
- We do not sell or share your data with third parties for marketing purposes

## Your Rights

You can:

- View all your data in the extension's settings pages
- Delete your data by removing the extension or clearing specific focuses
- Opt out of data sharing at any time
- Export your focuses by sharing them (creates a portable link)

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted at https://pwfocus.net/privacy

## Contact Us

If you have questions about this Privacy Policy, please contact us through the Chrome Web Store support page.

## Chrome Web Store Data Disclosure

In accordance with Chrome Web Store requirements:

| Data Type | Collection | Transmission | Purpose |
|-----------|------------|--------------|---------|
| User activity (websites visited) | No | No | N/A |
| Web browsing history | No | No | N/A |
| Focus link URLs | Yes (user-created) | Only when sharing | Share focuses between users |
| Page content | Yes (focus tabs only, user-initiated) | Yes (AI chat only, opt-in) | AI question answering |
| Excluded site patterns | Yes (user-configured) | No | Protect sensitive sites from AI context |
| Personal information | No | No | N/A |
| Authentication credentials | No | No | N/A |
| Financial information | No | No | N/A |

### User Control Over Data Sharing

| Feature | User Control |
|---------|-------------|
| AI Chat | Toggle on/off in settings; individual questions require explicit user action |
| Site Exclusion | Per-focus URL patterns can exclude any site from AI context |
| Data Storage | Opt-in required; can be disabled anytime |
| Focus Sharing | Only occurs when user clicks share button |
