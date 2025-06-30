# Mindpilot Desktop Extension (DXT)

## Building the Extension

To build the Mindpilot Desktop Extension (.dxt file), run:

```bash
npm run build:dxt
```

This will:
1. Clean any existing .dxt files
2. Build the project (client and server)
3. Create a zip archive named `mindpilot.dxt` in the `dxt/` directory

## Installation

Once built, the `mindpilot.dxt` file can be installed in any DXT-compatible application (like Claude Desktop) using their extension installation mechanism.

## What's Included

The DXT package contains:
- `manifest.json` - Extension metadata and configuration
- `dist/` - Compiled TypeScript files for both MCP server and HTTP server
- `node_modules/` - Production dependencies only
- `icon.png` - Extension icon (if available)

## User Configuration

The extension supports the following user configuration options:
- `port` - HTTP server port (default: 4000)
- `autoOpenBrowser` - Auto-open browser when starting UI (default: true)

## Requirements

- Node.js >= 20.0.0
- Supported platforms: macOS, Windows, Linux

## File Structure

```
dxt/
├── manifest.json      # DXT manifest configuration
├── .dxtignore        # Files to exclude from DXT package
├── README.md         # This file
└── mindpilot.dxt     # Built extension (after running npm run build:dxt)
```