# Self Kernel Browser Extension

Quick thought capture extension for Chrome/Edge browsers.

## Features

- 🚀 **Quick Capture**: Instantly save thoughts and ideas to your Self Kernel
- ⌨️ **Keyboard Shortcuts**:
  - `Ctrl+Shift+K` (Mac: `Cmd+Shift+K`): Open quick capture popup
  - `Ctrl+Shift+N` (Mac: `Cmd+Shift+N`): Capture selected text instantly
- 🖱️ **Context Menu**: Right-click to capture:
  - Selected text
  - Links
  - Current page
- 🏷️ **Tagging**: Add tags to organize your captures
- 📊 **Priority**: Set priority levels for each capture
- 📜 **Recent History**: View your last 10 captures

## Installation

### Chrome/Edge

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. The extension icon should appear in your toolbar

### Prerequisites

- Self Kernel server must be running on `localhost:3000`
- Start the server with: `npm start` in the main project directory

## Usage

### Quick Capture Popup

1. Click the extension icon or press `Ctrl+Shift+K`
2. Type your thought or idea
3. Optionally add tags (press Enter after each tag)
4. Select priority level
5. Click "Capture"

### Context Menu Capture

1. Select text on any page
2. Right-click and choose "Capture to Self Kernel"
3. The selected text will be saved instantly

### Keyboard Shortcut Capture

1. Select text on any page
2. Press `Ctrl+Shift+N` (Mac: `Cmd+Shift+N`)
3. A notification confirms the capture

## Configuration

### Change API URL

Edit `popup.js` and `background.js`:

```javascript
const API_URL = 'http://your-server:port/api';
```

### Customize Keyboard Shortcuts

1. Go to `chrome://extensions/shortcuts`
2. Find "Self Kernel - Quick Thought Capture"
3. Edit the keyboard shortcuts

## Icons

Create your own icons or use placeholder images:

- `icons/icon16.png` (16x16px)
- `icons/icon48.png` (48x48px)
- `icons/icon128.png` (128x128px)

## Troubleshooting

### "Self Kernel not running" error

- Ensure the server is running: `npm start`
- Check the server is accessible at `http://localhost:3000`
- Verify CORS is enabled on the server

### Extension not capturing

- Check browser console for errors (F12)
- Verify API URL matches your server configuration
- Ensure you're not on restricted pages (chrome:// URLs)

## Privacy

- All data is sent directly to your local Self Kernel instance
- No data is shared with third parties
- No external analytics or tracking

## License

Same as Self Kernel main project
