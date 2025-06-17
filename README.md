# Reveal MCP

See through your agent's eyes. Visualize legacy code, architect new systems, understand everything.

## ✨ Why Reveal?

- **🧠 Visualize Almost Anything in Your Codebase**: Your MCP agent can instantly create diagrams of code architecture, process diagrams, or system designs
- **📊 Export & Share**: Save any diagram as SVG to document discoveries or share insights with your team
- **🔓 Secure-ish**: Diagrams are never sent to the cloud. Everything stays between you, your agent, and your agent's LLM provider(s).

## 🚀 Quick Start

### Claude Code

`claude mcp add reveal-mcp npx foo`

### Cursor

### VS Code

### Windsurf

## Using the MCP server

In your coding agent make when you make requests to show me or create a diagram it should use the MCP server.

You can also update your rules file to give specific instructions when to use reveal.

## Example requests

"Show me this area of the code that we have been discussing as a diagram"

"Create a C4 diagram of this projects architcture."

"Show me the oauth flow as a sequence diagram"

## How it works

Anthropic and OpenAI models seem to be well trained to generate valid mermaid syntax. The MCP is designed to accept mermaid syntax input to renders diagrams. More types of visualizations may be added in the future.

## Development

For active development with hot module replacement:

```bash
npm install
```

```bash
npm run dev
```

Run claud code with the `--debug` flag to see mcp errors

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
# First, clone the repository and navigate to the project directory
git clone <repository-url>
cd mermaid-mcp

# Install dependencies
npm install

# Add to Claude Desktop (replace /path/to/mermaid-mcp with your actual path)
claude mcp add mermaid-dev -- npx tsx /path/to/mermaid-mcp/src/server/server.ts

# Start the development server
npm run dev
```

The development server will start with:
- MCP server on port 3001 (handles MCP protocol, API & WebSocket)
- Vite dev server on port 5173 (React UI with hot module replacement)

Visit http://localhost:5173 to see the UI while developing.

#### Production Mode

For production use:

```bash
# First, clone and build the project
git clone <repository-url>
cd mermaid-mcp
npm install
npm run build

# Add to Claude Desktop (replace /path/to/mermaid-mcp with your actual path)
claude mcp add mermaid-server -- node /path/to/mermaid-mcp/dist/server/server.js
```

The production server runs everything on port 3001.

#### Using the MCP Server

After adding the server to Claude Desktop:

1. Restart Claude Desktop to load the MCP server
2. Ask Claude to create a diagram: "Create a flowchart showing the login process"
3. Ask Claude to open the UI: "Open the diagram UI"
4. The browser will automatically open to show your diagrams
5. All diagrams created by Claude will appear in real-time in the UI

You can also manually visit:
- Development: http://localhost:5173
- Production: http://localhost:3001
