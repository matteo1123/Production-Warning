# PW Focus

A Chrome extension + web app for staying focused with customizable link collections, cursor warnings, and context notes.

## Project Structure

```
├── extension/           # Chrome extension
│   ├── manifest.json
│   ├── content.js       # Page content script
│   ├── focus.js         # Focus settings UI
│   ├── warnings.js      # Warning rules management
│   └── ...
│
├── focus-share-web/     # Focus sharing website (Next.js + Convex)
│   ├── src/app/
│   ├── convex/
│   ├── Dockerfile
│   └── ...
│
└── cloudbuild.yaml      # Cloud Build config for website deployment
```

## Features

- **Focus Bar**: Always-visible bar showing your current focus with quick links
- **Cursor Warnings**: Customizable visual warnings when hovering on production sites
- **Context Notes**: Add notes to specific pages (global or per-focus)
- **Share Focuses**: Share your focus sessions including links, warnings, and notes

## Development

### Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/` folder

### Website
```bash
cd focus-share-web
npm install
npx convex dev  # Start Convex backend
npm run dev     # Start Next.js dev server
```

## Deployment

Website auto-deploys to Google Cloud Run on push to main.
