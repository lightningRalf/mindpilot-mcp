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
import { validateMermaidSyntax, getValidDiagramTypes, ValidationResult } from './mermaid-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RenderResult {
  success: boolean;
  output?: string;
  format: string;
  renderTime: number;
  error?: string;
  clientSideRender?: boolean;
  warnings?: string[];
}


class MermaidMCPDemo {
  private server: Server;
  private fastify?: FastifyInstance;
  private uiPort = 4000;
  private wsClients: Set<any> = new Set();
  private isShuttingDown = false;
  private lastDiagram: { diagram: string; timestamp: string } | null = null;

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
            description: 'Render a Mermaid diagram to SVG format. CRITICAL RULES: 1) Node IDs must be alphanumeric without spaces (use A1, nodeA, start_node). 2) For node labels with special characters, wrap in quotes: A["Label with spaces"] or A["Process (step 1)"]. 3) For quotes in labels use &quot;, for < use &lt;, for > use &gt;. 4) For square brackets in labels use A["Array&#91;0&#93;"]. 5) Always close all brackets and quotes. 6) Use consistent arrow styles (either --> or ->). Example: graph TD\\n  A["Complex Label"] --> B{Decision?}\\n  B -->|Yes| C["Result &quot;OK&quot;"]\\n\\nIMPORTANT: If the diagram fails validation, the error message will explain what needs to be fixed. Please read the error carefully and retry with a corrected diagram.',
            inputSchema: {
              type: 'object',
              properties: {
                diagram: {
                  type: 'string',
                  description: 'Mermaid diagram syntax. MUST start with diagram type (graph TD, flowchart LR, sequenceDiagram, etc). Node IDs cannot have spaces. Use quotes for labels with spaces/special chars.'
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
          const diagram = args?.diagram as string || '';
          const background = args?.background as string || 'white';
          
          // Validate the diagram first
          const validation = await validateMermaidSyntax(diagram);
          
          // If validation fails with errors, return the errors to MCP client
          if (!validation.valid && validation.errors && validation.errors.length > 0) {
            const errorResult = {
              success: false,
              error: `Diagram validation failed: ${validation.errors.join(', ')}`,
              validation: validation,
              format: 'mermaid',
              clientSideRender: true,
              debug: {
                wsClients: this.wsClients.size,
                broadcast: false,
                timestamp: new Date().toISOString()
              }
            };
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(errorResult, null, 2)
                }
              ]
            };
          }
          
          const renderResult = await this.renderMermaid(diagram, background);
          
          // Add validation warnings to the result if any
          if (validation.warnings && validation.warnings.length > 0) {
            renderResult.warnings = validation.warnings;
          }
          
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
          
          // If no WebSocket clients are connected, open the browser automatically
          if (this.wsClients.size === 0) {
            const isProduction = process.env.NODE_ENV === 'production' || !process.stdin.isTTY;
            const url = isProduction 
              ? `http://localhost:${this.uiPort}` 
              : 'http://localhost:5173';
            
            try {
              await open(url);
              // Give the browser time to connect via WebSocket
              await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (error) {
              // Ignore errors opening browser
            }
          }
          
          // Cache the diagram for future connections
          if (renderResult.success && renderResult.output) {
            this.lastDiagram = {
              diagram: renderResult.output,
              timestamp: new Date().toISOString()
            };
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
        const result = await validateMermaidSyntax(diagram);
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
      
      // Send the last diagram if available
      if (this.lastDiagram) {
        ws.send(JSON.stringify({
          type: 'render_result',
          success: true,
          output: this.lastDiagram.diagram,
          format: 'mermaid',
          renderTime: 0,
          clientSideRender: true,
          cached: true,
          timestamp: this.lastDiagram.timestamp
        }));
      }

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
              const validation = await validateMermaidSyntax(message.diagram);
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
      // MCP mode - start both MCP server and UI server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      // Also start the UI server in MCP mode
      await this.setupUIServer();
      try {
        await this.fastify!.listen({ port: this.uiPort, host: '0.0.0.0' });
      } catch (err: any) {
        // Server might already be running, which is OK
        if (err.code !== 'EADDRINUSE') {
          // Log errors to stderr so they don't interfere with stdio protocol
          console.error('Failed to start Fastify server:', err);
        }
      }
      
      // Monitor parent process in MCP mode
      this.monitorParentProcess();
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

  private monitorParentProcess() {
    // Check if parent process is still alive periodically
    const checkInterval = setInterval(() => {
      try {
        // If we can't kill with signal 0 (just check), parent is gone
        process.kill(process.ppid, 0);
      } catch (error) {
        // Parent process is gone, exit gracefully
        clearInterval(checkInterval);
        this.cleanup().then(() => {
          process.exit(0);
        });
      }
    }, 1000); // Check every second
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

// Handle stdin end (when Claude Desktop exits)
process.stdin.on('end', async () => {
  await demo.cleanup();
  process.exit(0);
});

// Handle stdin close
process.stdin.on('close', async () => {
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