#!/usr/bin/env node
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
  private fastify?: FastifyInstance;
  private uiPort = 3001;
  private wsClients: Set<any> = new Set();
  private isShuttingDown = false;

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
        ] as Tool[]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'render_mermaid':
          const renderResult = await this.renderMermaid(
            args?.diagram as string,
            args?.background as string || 'white'
          );
          
          // Ensure UI server is set up before broadcasting
          if (!this.fastify) {
            await this.setupUIServer();
            try {
              await this.fastify!.listen({ port: this.uiPort, host: '0.0.0.0' });
            } catch (err: any) {
              // Server might already be running
              if (err.code !== 'EADDRINUSE') {
                throw err;
              }
            }
          }
          
          // Broadcast to all WebSocket clients
          this.broadcastToClients({
            type: 'render_result',
            ...renderResult
          });
          
          // Include debug info in response
          const debugInfo = {
            ...renderResult,
            debug: {
              wsClients: this.wsClients.size,
              broadcast: true,
              timestamp: new Date().toISOString()
            }
          };
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(debugInfo, null, 2)
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

    // Check if we're in MCP mode (when stdin is not a TTY)
    const isMCPMode = !process.stdin.isTTY;
    // Simple mode detection based on NODE_ENV
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Only log if not in MCP mode
    if (process.stdin.isTTY) {
      console.log(`🚀 Server running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    }
    
    // Serve static files in production mode OR when running as MCP server
    if (isProduction || isMCPMode) {
      // Production mode: serve the built React app from dist/public
      const projectRoot = path.resolve(__dirname, '../..');
      const builtClientPath = path.join(projectRoot, 'dist/public');
      
      await this.fastify.register(fastifyStatic, {
        root: builtClientPath
      });

      this.fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.sendFile('index.html');
      });
    }
    // In development mode, we don't serve any HTML - Vite dev server handles the UI

    // Debug endpoint
    this.fastify.get('/api/debug', async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        wsClients: this.wsClients.size,
        serverRunning: true,
        fastifyReady: this.fastify ? true : false
      });
    });

    // API routes for UI
    this.fastify.post('/api/render', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { diagram, background } = request.body as any;
        const result = await this.renderMermaid(diagram, background);
        
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

    // WebSocket route
    this.fastify.get('/ws', { websocket: true }, (connection: SocketStream, req: FastifyRequest) => {
      const ws = connection.socket;
      if (process.stdin.isTTY) {
        console.log('WebSocket client connected');
      }
      this.wsClients.add(ws);

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());

          switch (message.type) {
            case 'render':
              const result = await this.renderMermaid(
                message.diagram,
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
        if (process.stdin.isTTY) {
          console.log('WebSocket client disconnected');
        }
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

  private async renderMermaid(diagram: string, background: string = 'white'): Promise<RenderResult> {
    const startTime = Date.now();

    try {
      // For CDN-based rendering, we'll return the diagram and let the client render it
      return {
        success: true,
        output: diagram,
        format: 'mermaid',
        renderTime: Date.now() - startTime,
        clientSideRender: true
      };
    } catch (error: any) {
      return {
        success: false,
        format: 'mermaid',
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
      // If UI server isn't set up yet (e.g., in MCP mode), set it up now
      if (!this.fastify) {
        await this.setupUIServer();
        
        // Start Fastify server
        try {
          await this.fastify!.listen({ port: this.uiPort, host: '0.0.0.0' });
          
          // Add a small delay to ensure the server is fully ready
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err: any) {
          // Server might already be running
          if (err.code !== 'EADDRINUSE') {
            throw err;
          }
        }
      }

      const url = `http://localhost:${this.uiPort}`;

      // Verify server is actually listening before returning success
      const isListening = this.fastify?.server?.listening || false;
      
      if (!isListening) {
        throw new Error('Fastify server failed to start - not listening on port ' + this.uiPort);
      }
      
      if (autoOpen) {
        await open(url);
        // Give the WebSocket time to connect
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        success: true,
        url,
        port: this.uiPort,
        message: autoOpen ? 'UI opened in browser' : 'UI server started',
        wsClients: this.wsClients.size,
        serverListening: isListening,
        fastifyReady: this.fastify ? true : false
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }


  async start() {
    // Check if we're running as an MCP server (when stdin is a pipe/not a TTY)
    const isMCPMode = !process.stdin.isTTY;
    
    if (isMCPMode) {
      // MCP mode - only start the MCP server, no UI server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      // No console logs in MCP mode as they would interfere with stdio protocol
    } else {
      // Standalone mode - only start UI server (no MCP server)
      await this.setupUIServer();
      
      // Start Fastify server
      try {
        await this.fastify!.listen({ port: this.uiPort, host: '0.0.0.0' });
        console.log(`🌐 UI Server running on http://localhost:${this.uiPort}`);
      } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
      }

      // DO NOT start MCP server in standalone mode - it's only for Claude Desktop
      console.log('🔧 Running in standalone mode (no MCP server)');

      // Auto-open UI
      if (process.env.NODE_ENV === 'production') {
        // Production mode - open the MCP server port
        try {
          await open(`http://localhost:${this.uiPort}`);
          console.log(`🚀 Production server opened at http://localhost:${this.uiPort}`);
        } catch (error) {
          console.log(`ℹ️  Could not auto-open browser. Visit http://localhost:${this.uiPort} manually`);
        }
      } else {
        // Dev mode - open the Vite dev server port
        try {
          await open('http://localhost:5173');
          console.log('🚀 Development UI opened at http://localhost:5173');
        } catch (error) {
          console.log('ℹ️  Could not auto-open browser. Visit http://localhost:5173 manually');
        }
      }
    }
  }

  async cleanup() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    try {
      // Close all WebSocket connections
      this.wsClients.forEach(client => {
        if (client.readyState === 1) {
          client.close();
        }
      });
      this.wsClients.clear();

      // Close Fastify server
      if (this.fastify) {
        await this.fastify.close();
      }

      // Close MCP server
      await this.server.close();
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
}

// Start the demo server
const demo = new MermaidMCPDemo();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await demo.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await demo.cleanup();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  if (!process.stdin.isTTY) {
    // In MCP mode, don't log to stdout
  } else {
    console.error('Uncaught exception:', error);
  }
  await demo.cleanup();
  process.exit(1);
});

demo.start().catch(async (error) => {
  if (!process.stdin.isTTY) {
    // In MCP mode, don't log to stdout
  } else {
    console.error('Failed to start server:', error);
  }
  await demo.cleanup();
  process.exit(1);
});