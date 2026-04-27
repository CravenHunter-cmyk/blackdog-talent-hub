# BlackDog Recruiting Helper

This folder contains the first Chrome Extension prototype for the BlackDog Recruiting Helper Side Panel.

## What it does

- Detects the active Upwork conversation from the current page.
- Builds and stores multiple candidate profiles locally with `chrome.storage.local`.
- Calls the local Next.js AI endpoint at `http://localhost:3000/api/recruiting-ai` for translations, profile extraction, reply suggestions, and analysis.
- Provides reusable project script templates.
- Does not send messages automatically.
- Does not auto-login to Upwork.
- Does not save passwords.
- Does not modify the Upwork page DOM.

## Install locally

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `browser-extension` folder in this project.
6. Open `upwork.com` and go to Messages.
7. Click the extension icon to open the Side Panel.
8. Click **Sync Current Conversation**.
9. Make sure the BlackDog Next.js app is running locally so the AI endpoint is available.

## Notes

- This is Preview Mode only.
- The extension only reads the current Upwork conversation text.
- It keeps multiple candidate profiles locally in Chrome storage.
- It is intended to be a bridge between Upwork and BlackDog Recruiting Workbench later.

## Reload after changes

After updating the extension files, go to `chrome://extensions` and reload **BlackDog Recruiting Helper**.
