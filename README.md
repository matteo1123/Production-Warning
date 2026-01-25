# Production Warning - Focus Mode Extension

A Chrome extension that helps you stay focused by displaying a customizable focus bar with quick links, and warns you when navigating production environments.

## Project Structure

```
├── extension/           # Chrome extension
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── focus.js
│   └── ...
│
├── focus-share-web/     # Focus sharing website (Next.js)
│   ├── src/app/
│   ├── convex/
│   ├── Dockerfile
│   └── ...
│
└── cloudbuild.yaml      # Cloud Build config for website deployment
```

## Extension Features

- **Focus Bar**: Always-visible bar showing your current focus with quick links
- **Production Warning**: Visual warning when hovering over elements on production sites
- **Context Notes**: Add notes to specific pages
- **Share Focuses**: Share your focus sessions with others

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

The website auto-deploys to Google Cloud Run when changes are pushed to `focus-share-web/`.

Configure the Cloud Build trigger with:
- **Included files filter**: `focus-share-web/**`
- **Substitution variables**:
  - `_CONVEX_URL`: Your Convex deployment URL
  - `_REGION`: Cloud Run region (default: us-central1)
