## To do

Must
[ ] Client needs to not hardcode port number
[ ] Open new tab if WS client count is 0
[ ] Button styling fixes
[ ] Connect tab styling
[x] Fix websocket issue
[x] React refactor
[x] Dark and light themes (save preference somewhere?)
[ ] Websocket reconnect from stale browser windows
  Some kind of timer?
  How can they get the last known diagram when reconnected? (should use the local history mechanism)

Should
[ ] animate panel (but fast)
[ ] Mermaid Parse error should be fed back to MCP client
[ ] Zoom to fit issue with large diagrams (or is it diagrams sent via mcp??)
[ ] Save past diagrams (sent by MCP and with live edits (no versioning sorry))
[ ] Improve rendering of mermaid errors in client
[x] Remember dark mode state
[x] Remember panel width state
[x] Use Fastify
[x] Replace radix icons with lucide
[x] Zoom (pinch + on screen buttons)
- Null state handling
- Title of downloaded diagram is correct
- Metadata
  - Project name
  - Diagram title
  - Addtional diagram context (non in mermaid)
[x] Swap darkmode and svg icons

Could

- Tests


Wont
