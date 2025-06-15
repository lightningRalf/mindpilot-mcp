// server.ts - Mermaid MCP Demo Server with CDN-based rendering
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { SocketStream } from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RenderResult {
  success: boolean;
  output?: string;
  format: string;
  theme: string;
  renderTime: number;
  error?: string;
  clientSideRender?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

class MermaidMCPDemo {
  private server: Server;
  private fastify!: FastifyInstance;
  private uiPort = 3001;
  private wsClients: Set<any> = new Set();

  constructor() {
    this.server = new Server(
      {
        name: 'projectionist',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupMCPHandlers();
  }

  private setupMCPHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'render_mermaid',
            description: 'Render a Mermaid diagram to SVG format',
            inputSchema: {
              type: 'object',
              properties: {
                diagram: {
                  type: 'string',
                  description: 'Mermaid diagram syntax'
                },
                theme: {
                  type: 'string',
                  description: 'Diagram theme (default, dark, forest, neutral)',
                  default: 'default'
                },
                background: {
                  type: 'string',
                  description: 'Background color',
                  default: 'white'
                }
              },
              required: ['diagram']
            }
          },
          {
            name: 'validate_mermaid',
            description: 'Validate Mermaid diagram syntax without rendering',
            inputSchema: {
              type: 'object',
              properties: {
                diagram: {
                  type: 'string',
                  description: 'Mermaid diagram syntax to validate'
                }
              },
              required: ['diagram']
            }
          },
          {
            name: 'open_ui',
            description: 'Open the web-based user interface',
            inputSchema: {
              type: 'object',
              properties: {
                autoOpen: {
                  type: 'boolean',
                  description: 'Automatically open browser',
                  default: true
                }
              }
            }
          },
          {
            name: 'list_themes',
            description: 'List available Mermaid themes',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ] as Tool[]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'render_mermaid':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(await this.renderMermaid(
                  args?.diagram as string,
                  args?.theme as string || 'default',
                  args?.background as string || 'white'
                ), null, 2)
              }
            ]
          };

        case 'validate_mermaid':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(this.validateMermaid(args?.diagram as string), null, 2)
              }
            ]
          };

        case 'open_ui':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(await this.openUI(args?.autoOpen as boolean), null, 2)
              }
            ]
          };

        case 'list_themes':
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(this.listThemes(), null, 2)
              }
            ]
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async setupUIServer() {
    this.fastify = Fastify({
      logger: false
    });

    // Register WebSocket plugin
    await this.fastify.register(fastifyWebsocket);

    // Register static file plugin
    await this.fastify.register(fastifyStatic, {
      root: path.join(__dirname, 'public')
    });

    // Main UI route
    this.fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.type('text/html').send(this.getUIHTML());
    });

    // API routes for UI
    this.fastify.post('/api/render', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { diagram, theme, background } = request.body as any;
        const result = await this.renderMermaid(diagram, theme, background);
        
        // Broadcast to all WebSocket clients
        this.broadcastToClients({
          type: 'render_result',
          ...result
        });
        
        return reply.send(result);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    });

    this.fastify.post('/api/validate', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { diagram } = request.body as any;
        const result = this.validateMermaid(diagram);
        return reply.send(result);
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    });

    this.fastify.get('/api/themes', async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send(this.listThemes());
    });

    // WebSocket route
    this.fastify.get('/ws', { websocket: true }, (connection: SocketStream, req: FastifyRequest) => {
      const ws = connection.socket;
      console.log('WebSocket client connected');
      this.wsClients.add(ws);

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());

          switch (message.type) {
            case 'render':
              const result = await this.renderMermaid(
                message.diagram,
                message.theme || 'default',
                message.background || 'white'
              );
              ws.send(JSON.stringify({
                type: 'render_result',
                ...result
              }));
              break;

            case 'validate':
              const validation = this.validateMermaid(message.diagram);
              ws.send(JSON.stringify({
                type: 'validation_result',
                ...validation
              }));
              break;
          }
        } catch (error: any) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.wsClients.delete(ws);
      });
    });
  }


  private broadcastToClients(message: any) {
    const messageStr = JSON.stringify(message);
    this.wsClients.forEach((client) => {
      if (client.readyState === 1) { // 1 = OPEN state
        client.send(messageStr);
      }
    });
  }

  private async renderMermaid(diagram: string, theme: string = 'default', background: string = 'white'): Promise<RenderResult> {
    const startTime = Date.now();

    try {
      // For CDN-based rendering, we'll return the diagram and let the client render it
      return {
        success: true,
        output: diagram,
        format: 'mermaid',
        theme,
        renderTime: Date.now() - startTime,
        clientSideRender: true
      };
    } catch (error: any) {
      return {
        success: false,
        format: 'mermaid',
        theme,
        renderTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private validateMermaid(diagram: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic validation rules
      if (!diagram || diagram.trim().length === 0) {
        errors.push('Diagram cannot be empty');
        return { valid: false, errors };
      }

      // Try to parse with Mermaid to catch syntax errors
      const lines = diagram.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const firstLine = lines[0];

      // Check for valid diagram type
      const validTypes = [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
        'stateDiagram', 'pie', 'gantt', 'journey', 'gitgraph',
        'erDiagram', 'mindmap', 'timeline', 'sankey', 'block'
      ];

      const hasValidType = validTypes.some(type =>
        firstLine?.toLowerCase().startsWith(type.toLowerCase())
      );

      if (!hasValidType) {
        warnings.push('Diagram type not clearly specified. Consider starting with a diagram type declaration.');
      }

      // Check for common syntax patterns
      if (diagram.includes('-->') && diagram.includes('->')) {
        warnings.push('Mixed arrow styles detected. Consider using consistent arrow types.');
      }

      // Check for unclosed brackets/parentheses
      const openBrackets = (diagram.match(/\[/g) || []).length;
      const closeBrackets = (diagram.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push('Unmatched square brackets detected');
      }

      const openParens = (diagram.match(/\(/g) || []).length;
      const closeParens = (diagram.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        warnings.push('Unmatched parentheses detected');
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`]
      };
    }
  }

  private async openUI(autoOpen: boolean = true): Promise<any> {
    try {
      // Server is already started in the start() method

      const url = `http://localhost:${this.uiPort}`;

      if (autoOpen) {
        await open(url);
      }

      return {
        success: true,
        url,
        port: this.uiPort,
        message: autoOpen ? 'UI opened in browser' : 'UI server started'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private listThemes(): any {
    return {
      themes: [
        { name: 'default', description: 'Default Mermaid theme with blue colors' },
        { name: 'dark', description: 'Dark theme optimized for low-light environments' },
        { name: 'forest', description: 'Green forest theme with nature-inspired colors' },
        { name: 'neutral', description: 'Neutral grayscale theme for professional documents' },
        { name: 'base', description: 'Minimal base theme with clean styling' }
      ]
    };
  }

  private getUIHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid MCP Demo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }


        .container {
            display: flex;
            flex: 1;
            padding: 1rem;
            height: 100vh;
            position: relative;
        }

        .editor-panel {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            transition: width 0.3s ease;
            overflow: hidden;
            margin-right: 1rem;
        }
        
        .editor-panel.collapsed {
            width: 40px !important;
            min-width: 40px !important;
        }
        
        .resize-handle {
            position: absolute;
            right: -5px;
            top: 0;
            bottom: 0;
            width: 10px;
            cursor: col-resize;
            background: transparent;
            z-index: 10;
        }
        
        .resize-handle:hover {
            background: rgba(66, 153, 225, 0.2);
        }

        .preview-panel {
            flex: 1;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
        }

        .panel-header {
            background: #edf2f7;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #e2e8f0;
            border-radius: 8px 8px 0 0;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
        }
        
        .collapse-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.25rem;
            margin-right: 0.5rem;
            color: #4a5568;
            font-size: 1.2rem;
            transition: transform 0.3s ease;
        }
        
        .collapse-btn:hover {
            color: #2d3748;
        }
        
        .editor-panel.collapsed .collapse-btn {
            transform: rotate(180deg);
        }
        
        .editor-panel.collapsed .panel-header span:not(.collapse-btn),
        .editor-panel.collapsed .controls {
            display: none;
        }

        .controls {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        select, button {
            padding: 0.25rem 0.5rem;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            font-size: 0.875rem;
        }

        button {
            background: #4299e1;
            color: white;
            border: none;
            cursor: pointer;
        }

        button:hover {
            background: #3182ce;
        }

        .editor {
            flex: 1;
            border: none;
            padding: 1rem;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 14px;
            resize: none;
            outline: none;
            transition: opacity 0.3s ease;
        }
        
        .editor-panel.collapsed .editor {
            opacity: 0;
            pointer-events: none;
        }

        .preview {
            flex: 1;
            padding: 1rem;
            overflow: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }

        .error {
            color: #e53e3e;
            background: #fed7d7;
            padding: 0.5rem;
            border-radius: 4px;
            margin: 0.5rem;
        }

        .status {
            font-size: 0.75rem;
            color: #718096;
            padding: 0.5rem 1rem;
            background: #f7fafc;
            border-top: 1px solid #e2e8f0;
            transition: opacity 0.3s ease;
        }
        
        .editor-panel.collapsed .status {
            opacity: 0;
        }

        .loading {
            opacity: 0.6;
        }

        /* Mermaid diagram styling */
        .mermaid {
            max-width: 100%;
            max-height: 100%;
        }

        .preview-content {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>
<body>
    <div class="container" id="container">
        <div class="editor-panel" id="editorPanel" style="width: 50%;">
            <div class="panel-header">
                <div style="display: flex; align-items: center;">
                    <button class="collapse-btn" onclick="toggleEditor()" title="Toggle editor">◀</button>
                    <span>📝 Diagram Editor</span>
                </div>
                <div class="controls">
                    <button onclick="validateDiagram()">Validate</button>
                    <button onclick="renderDiagram()">Render</button>
                </div>
                <div class="resize-handle"></div>
            </div>
            <textarea id="editor" class="editor" placeholder="Enter your Mermaid diagram here...">graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A
    C --> E[End]</textarea>
            <div class="status" id="status">Ready</div>
        </div>

        <div class="preview-panel">
            <div class="panel-header">
                <span>👁️ Live Preview</span>
                <div class="controls">
                    <select id="themeSelect">
                        <option value="default">Default</option>
                        <option value="dark">Dark</option>
                        <option value="forest">Forest</option>
                        <option value="neutral">Neutral</option>
                        <option value="base">Base</option>
                    </select>
                    <button onclick="exportSVG()">Export SVG</button>
                </div>
            </div>
            <div class="preview" id="preview">
                <div class="preview-content">
                    <div style="color: #718096;">Loading Mermaid...</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Load Mermaid from CDN -->
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

        // Initialize Mermaid
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        });

        // Make mermaid available globally
        window.mermaidLib = mermaid;

        // Initialize the app after Mermaid is loaded
        initializeApp();
    </script>

    <script>
        let ws;
        let renderTimeout;
        let currentTheme = 'default';
        let isUpdatingFromBroadcast = false;
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        async function initializeApp() {
            console.log('Mermaid loaded, initializing app...');
            initWebSocket();
            // Initial render
            setTimeout(() => renderDiagram(), 500);
        }

        // Initialize WebSocket connection
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:3001/ws');

            ws.onopen = () => {
                updateStatus('Connected');
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };

            ws.onclose = () => {
                updateStatus('Disconnected - Reconnecting...');
                setTimeout(initWebSocket, 2000);
            };

            ws.onerror = (error) => {
                updateStatus('Connection error');
            };
        }

        async function handleWebSocketMessage(data) {
            const preview = document.getElementById('preview');

            switch (data.type) {
                case 'render_result':
                    if (data.success && data.output) {
                        // Set flag to prevent auto-render
                        isUpdatingFromBroadcast = true;
                        
                        // Update editor text
                        const editor = document.getElementById('editor');
                        editor.value = data.output;
                        
                        // Update theme selector
                        const themeSelect = document.getElementById('themeSelect');
                        if (data.theme && themeSelect.value !== data.theme) {
                            themeSelect.value = data.theme;
                        }
                        
                        // Reset flag after a short delay
                        setTimeout(() => { isUpdatingFromBroadcast = false; }, 100);
                        
                        await renderMermaidDiagram(data.output, data.theme || 'default');
                        updateStatus('Rendered successfully (via broadcast)');
                    } else {
                        preview.innerHTML = \`<div class="error">Render error: \${data.error}</div>\`;
                        updateStatus('Render failed');
                    }
                    break;

                case 'validation_result':
                    let message = data.valid ? 'Valid ✓' : 'Invalid ✗';
                    if (data.errors) {
                        message += ' - Errors: ' + data.errors.join(', ');
                    }
                    if (data.warnings) {
                        message += ' - Warnings: ' + data.warnings.join(', ');
                    }
                    updateStatus(message);
                    break;

                case 'error':
                    updateStatus('Error: ' + data.message);
                    break;
            }
        }

        async function renderMermaidDiagram(diagram, theme) {
            const preview = document.getElementById('preview');

            try {
                // Update theme if changed
                if (theme !== currentTheme) {
                    currentTheme = theme;
                    window.mermaidLib.initialize({
                        startOnLoad: false,
                        theme: theme,
                        securityLevel: 'loose',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    });
                }

                // Generate unique ID
                const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

                // Render the diagram
                const { svg } = await window.mermaidLib.render(id, diagram);

                // Display the result
                preview.innerHTML = \`<div class="preview-content">\${svg}</div>\`;

            } catch (error) {
                console.error('Mermaid render error:', error);
                preview.innerHTML = \`<div class="error">Mermaid Error: \${error.message}</div>\`;
            }
        }

        function renderDiagram() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                // Fallback to direct rendering if WebSocket not available
                const diagram = document.getElementById('editor').value;
                const theme = document.getElementById('themeSelect').value;
                renderMermaidDiagram(diagram, theme);
                return;
            }

            const diagram = document.getElementById('editor').value;
            const theme = document.getElementById('themeSelect').value;

            clearTimeout(renderTimeout);
            updateStatus('Rendering...');

            ws.send(JSON.stringify({
                type: 'render',
                diagram: diagram,
                theme: theme
            }));
        }

        function validateDiagram() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                updateStatus('WebSocket not connected');
                return;
            }

            const diagram = document.getElementById('editor').value;

            ws.send(JSON.stringify({
                type: 'validate',
                diagram: diagram
            }));
        }

        function exportSVG() {
            const preview = document.getElementById('preview');
            const svg = preview.querySelector('svg');

            if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const blob = new Blob([svgData], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = 'mermaid-diagram.svg';
                a.click();

                URL.revokeObjectURL(url);
                updateStatus('SVG exported');
            } else {
                updateStatus('No diagram to export');
            }
        }

        function updateStatus(message) {
            document.getElementById('status').textContent = message;
        }

        // Auto-render on input change (debounced)
        document.getElementById('editor').addEventListener('input', () => {
            if (!isUpdatingFromBroadcast) {
                clearTimeout(renderTimeout);
                renderTimeout = setTimeout(renderDiagram, 1000);
            }
        });

        // Theme change
        document.getElementById('themeSelect').addEventListener('change', renderDiagram);
        
        // Collapse/Expand functionality
        function toggleEditor() {
            const editorPanel = document.getElementById('editorPanel');
            const container = document.getElementById('container');
            editorPanel.classList.toggle('collapsed');
            
            if (editorPanel.classList.contains('collapsed')) {
                editorPanel.style.width = '40px';
            } else {
                editorPanel.style.width = '50%';
            }
        }
        
        // Make toggleEditor available globally
        window.toggleEditor = toggleEditor;
        
        // Resize functionality
        const resizeHandle = document.querySelector('.resize-handle');
        const editorPanel = document.getElementById('editorPanel');
        const container = document.getElementById('container');
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = editorPanel.offsetWidth;
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const diff = e.clientX - startX;
            const newWidth = startWidth + diff;
            const containerWidth = container.offsetWidth;
            const minWidth = 200;
            const maxWidth = containerWidth - 300; // Leave at least 300px for preview
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                editorPanel.style.width = newWidth + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
            }
        });
    </script>
</body>
</html>
    `;
  }

  async start() {
    // Setup UI server with routes and WebSocket
    await this.setupUIServer();
    
    // Start Fastify server
    try {
      await this.fastify.listen({ port: this.uiPort, host: '0.0.0.0' });
      console.log(`🌐 UI Server running on http://localhost:${this.uiPort}`);
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }

    // Start MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🔌 MCP Server connected via stdio');

    // Auto-open UI
    try {
      await open(`http://localhost:${this.uiPort}`);
      console.log('🚀 Browser opened automatically');
    } catch (error) {
      console.log('ℹ️  Could not auto-open browser. Visit http://localhost:3001 manually');
    }
  }
}

// Start the demo server
const demo = new MermaidMCPDemo();
demo.start().catch(console.error);