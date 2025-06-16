# Obscura MCP

See through your agent's eyes. Visualize legacy code, architect new systems, understand everything.

## ✨ Why Obscura?

- **🧠 Visualize Anything**: Your MCP agent can instantly create diagrams of code architecture, process diagrams, or system designs
- **👁️ See Through Agent's Eyes**: Watch in real-time as Claude explores codebases and builds mental models
- **📊 Export & Share**: Save any diagram as SVG to document discoveries or share insights with your team
- **🔓 Secure-ish**: Diagrams are never sent to the cloud. Everything stays between you, your agent, and your agent's LLM provider(s).

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

TO DO

### Development Installation

For active development with hot module replacement:

```bash
npm install
```

```bash
npm run dev
```

This runs:
- MCP server on port 3001 (API & WebSocket)
- Vite dev server on port 5173 (React UI with HMR)

Visit http://localhost:5173 to see the UI. Changes to React components will update instantly.

### Production Mode

For production deployment:

```bash
# Build everything first
npm run build

# Run production server
npm start
```

Visit http://localhost:3001 to use the application.

### MCP Configuration

To use this server with Claude Desktop, you need to add it to your MCP settings.

#### Development Mode

For local development with hot reloading:

```bash
# First, start the dev server
npm run dev

# Then add to Claude Desktop
claude mcp add mermaid-dev -- npx tsx /Users/alex/Projects/mermaid-mcp/src/server/server.ts
```

#### Production Mode

For production use:

```bash
# First, build the project
npm run build

# Then add to Claude Desktop
claude mcp add mermaid-server -- node /Users/alex/Projects/mermaid-mcp/dist/server/server.js
```

Or if published to npm:

```bash
claude mcp add mermaid-server -- npx @your-username/mermaid-mcp
```

After adding, restart Claude Desktop to load the MCP server.
