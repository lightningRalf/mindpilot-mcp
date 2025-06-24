## To Do

### Must
- ~~Set engine to 20.0.0~~
- ~~only log if --debug~~
- ~~Support multiple MCP hosts (singleton refactor)~~
- ~~Auto reconnect stale browser windows~~

### Should
- [MCP Client] Fix memory leak - MaxListenersExceededWarning
  - Event listeners accumulate without cleanup
  - stdin listener added on each start() without removal (line 515)
  - Use once() where appropriate, add proper cleanup
- [HTTP Server] Fix memory leak - interval never cleared
  - Shutdown check interval runs forever (line 56-58)
  - Store interval reference and clear on stop()
- [HTTP Server] Improve type safety
  - Remove `any` types for browserConnections and request bodies
  - Add proper TypeScript interfaces
- Refactor App.tsx (585 lines)
  - Extract state management to custom hooks
- Accessibility
- Diagram title (fixed to header for now)
- Diagram history
- Favicon
- Add high viz color instructions to prompt
- Clean up light and dark themes (button backgrounds)
- Revisit keyboard shortcuts
- Tests
  - [Shared] Mermaid validator
  - [HTTP Server] Server endpoints
  - [MCP Client] MCP tools
  - [HTTP Server] Websocket state machine
  - [React Client] Component tests
- ~~Refactor server vibe code~~
- ~~Refactor client code~~
  - ~~Componentize~~
  - ~~WebSocket state machine~~

### Could
- CI workflow
- Metadata
  - Project name
  - Diagram name
    - Use as title on downloaded diagrams
  - Addtional diagram context
- Animate panel toggling
- Color themes

### Wont
- ?
