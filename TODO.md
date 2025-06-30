## To Do

### Must
- Sanitize curly braces in Flowchart labels
- Parsing bug in ERDs
- ~~Try to open new window if browser considers itself hidden~~
- ~~Claude Desktop bug~~
- ~~Check open tabs for visibility and open new tab if all are hidden~~
- ~~Set engine to 20.0.0~~
- ~~only log if --debug~~
- ~~Support multiple MCP hosts (singleton refactor)~~
- ~~Auto reconnect stale browser windows~~

### Should
- Download both text and svg
- [MCP Client] Fix memory leak
  - (node:13404) MaxListenersExceededWarning: Possible EventTarget memory leak detected. 11 abort listeners added to [AbortSignal]. Use events.setMaxListeners() to increase limit
- [HTTP Server] Fix memory leak - interval never cleared
  - Shutdown check interval runs forever (line 56-58)
  - Store interval reference and clear on stop()
- [HTTP Server] Improve type safety
  - Remove `any` types for browserConnections and request bodies
  - Add proper TypeScript interfaces
- Refactor App.tsx
- Accessibility
- Review keyboard shortcuts
- Tests
- ~~Favicon~~
- ~~Clean up light and dark themes~~
- ~~Add high viz color instructions to prompt~~
- ~~Refactor server vibe code~~
- ~~Refactor client code~~
  - ~~Componentize~~
  - ~~WebSocket state machine~~

### Could
- Diagram history / title
- Animate panel toggling
- Color themes
- Metadata
  - Project name
  - Diagram name
    - Use as title on downloaded diagrams
  - Addtional diagram context
