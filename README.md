# KeepFocus

KeepFocus is a lightweight browser extension designed to help users stay focused by blocking distracting websites, filtering content, enforcing break schedules, and providing a configurable, localized experience.

## 🚀 What it does

- Blocks distracting sites using browser declarative net request (DNR) rules
- Filters content on major social networks like Facebook, YouTube, Instagram, and X
- Supports custom blocked sites and redirect URL customization
- Offers scheduled focus sessions with break and pause timings
- Preserves user preferences and theme choice across browser restarts
- Includes multi-language support and runtime translations

## ✨ Key features

- Site blocking and custom site management
- Break time and pause time scheduling
- Day-based active schedule support
- Redirect on block with configurable target URL
- Adult content blocking and adult site rule injection
- Persistent settings and language/theme preferences
- Theme toggle with dark mode support
- Real-time updates when settings change
- Background script and content script communication
- Support for major host patterns and social network pages

## 📦 Installation

1. Open your browser's extensions page:
   -in Chrome: `chrome://extensions`
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `KeepFocus` project folder.
5. The extension should appear in the toolbar.

## 🧠 Usage

1. Click the KeepFocus toolbar icon to open the popup.
2. Navigate between available tabs and configure settings.
3. Use the language selector to switch translations.
4. Enable or disable blocking for each site.
5. Add or remove custom sites from the blocked list.
6. Set break time and pause time durations to manage focus cycles.
7. Configure schedules to activate blocking only on selected days.

## 🧩 How it works

- `manifest.json` declares the extension permissions, host access, content scripts, and popup UI.
- `src/background/background.js` runs as the service worker and initializes focus rules.
- `src/background/dnr-manager.js` manages browser declarative net request rules.
- `src/background/store-manager.js` handles persistent storage of extension settings.
- `src/background/message-handler.js` routes messages between popup, content scripts, and background logic.
- `src/content/content.js` injects filtering behavior into supported pages.
- `popup/` contains UI scripts and styles for the extension popup.

## 📁 Project structure

- `manifest.json` — extension metadata and permissions
- `popup.html` — popup entry point
- `src/background/` — background logic and scheduling
- `src/content/` — content script for page filtering
- `src/popup/` — popup UI scripts and styles
- `src/shared/` — shared translations and data resources
- `src/assets/` — icons and flag assets

## 🛠️ Contributing

Contributions are welcome. To help improve KeepFocus:

1. Fork the repository.
2. Create a feature branch.
3. Submit a pull request with a clear description.
4. Keep changes focused and easy to review.

## 📣 Notes

- This extension uses browser storage to preserve user settings.
- DNR rules are updated in the background at startup and every minute.
- Content filtering is applied for supported social network pages via content scripts.

## 📄 License

This project is open source. Add your chosen license file to the repository to make the terms explicit.
