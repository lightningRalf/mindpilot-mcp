## Roadmap

### 0.3.0

#### Must
- Local diagram history
- Diagram titles
- Keyboard shortcuts
- ~~Fix port bug~~
- ~~Fix MaxListenersExceededWarning --> https://github.com/anthropics/claude-code/issues/2506~~
- ~~Try to open new window if browser considers itself hidden~~
- ~~Claude Desktop bug~~
- ~~Check open tabs for visibility and open new tab if all are hidden~~
- ~~Set engine to 20.0.0~~
- ~~only log if --debug~~
- ~~Support multiple MCP hosts (singleton refactor)~~
- ~~Auto reconnect stale browser windows~~

#### Should
- Improve mermaid sytax error detection
  - Sanitize curly braces in Flowchart labels
  - Sanitize forward slashes in urls (api urls typically)
  - Sanitize parsing bugs in ERDs
- Refactor App.tsx
- Accessibility
- Tests
- Animate panel toggling
- ~~Favicon~~
- ~~Clean up light and dark themes~~
- ~~Add high viz color instructions to prompt~~
- ~~Refactor server vibe code~~
- ~~Refactor client code~~
  - ~~Componentize~~
  - ~~WebSocket state machine~~

#### Could
- Tests

#### Wont
- Color themes
