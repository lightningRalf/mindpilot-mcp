## To do

Must
[ ] MCP test harness (uses production build) - DOCUMENT
[x] Fix websocket issue
[x] React refactor
[x] Dark and light themes (save preference somewhere?)
[ ] Websocket reconnect from stale browser windows
  Some kind of timer?
  How can they get the last known diagram when reconnected? (should use the local history mechanism)

Should
[ ] Save past diagrams (sent by MCP and with live edits (no versioning sorry))
[ ] Remember dark mode state
[ ] Remember panel width state

[x] Use Fastify
[] Replace radix icons with lucide
- Zoom (pinch + on screen buttons)
- Save history (somewhere - local storage?)

- Null state handling
- Metadata
  - Diagram title ()
  - Addtional diagram context (non in mermaid)
  - Codebase?
- Swap darkmode and svg icons
- Title of exported diagram is correct

Could
- Improve rendering of mermaid errors in client
- Tests


Wont
