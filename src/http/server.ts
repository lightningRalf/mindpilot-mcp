import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import fastifyStatic from "@fastify/static";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import open from "open";
import { setMaxListeners } from "events";
import { httpLogger as logger } from "../shared/logger.js";
import {
  RenderResult,
  ServerStatus,
} from "../shared/types.js";
import { renderMermaid } from "../shared/renderer.js";
import { validateMermaidSyntax } from "../shared/validator.js";
import { historyService } from "../shared/historyService.js";
import { detectGitRepo } from "../shared/gitRepoDetector.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SingletonHTTPServer {
  private fastify: FastifyInstance | null = null;
  private port: number;
  private startTime: Date = new Date();
  private lastMcpActivity: Date = new Date(); // Track last MCP client activity
  private shutdownTimer: NodeJS.Timeout | null = null;
  private readonly SHUTDOWN_DELAY_MS = 5000; // 5 seconds grace period
  private readonly MCP_TIMEOUT_MS = 60000; // 60 seconds MCP timeout
  private disableAnalytics: boolean;

  constructor(port: number = 4000, disableAnalytics: boolean = false) {
    this.port = port;
    this.disableAnalytics = disableAnalytics;
  }

  async start(): Promise<void> {
    if (this.fastify) {
      return; // Already running
    }

    this.fastify = Fastify({
      logger: false,
    });

    await this.setupRoutes();

    try {
      await this.fastify.listen({ port: this.port, host: "0.0.0.0" });
      logger.info(`Singleton HTTP server started on port ${this.port}`);
      this.cancelShutdownTimer();

      // Start checking for shutdown periodically
      setInterval(() => {
        this.checkForShutdown();
      }, 30000); // Check every 30 seconds
    } catch (error) {
      logger.error("Failed to start HTTP server", { error });
      throw error;
    }
  }

  private async setupRoutes() {
    if (!this.fastify) return;

    // Serve static files in production mode
    const isProduction = process.env.NODE_ENV !== "development";
    if (isProduction) {
      const projectRoot = path.resolve(__dirname, "../..");
      const builtClientPath = path.join(projectRoot, "dist/public");

      // Check if built client exists
      try {
        await fs.access(builtClientPath);
        await this.fastify.register(fastifyStatic, {
          root: builtClientPath,
        });

        this.fastify.get(
          "/",
          async (request: FastifyRequest, reply: FastifyReply) => {
            return reply.sendFile("index.html");
          },
        );

        // Handle /artifact/:id route for direct diagram access
        this.fastify.get(
          "/artifact/:id",
          async (request: FastifyRequest, reply: FastifyReply) => {
            return reply.sendFile("index.html");
          },
        );
      } catch {
        logger.warn(
          "Built client not found. Run 'npm run build' to build the client.",
        );
      }
    }

    // Status endpoint
    this.fastify.get(
      "/api/status",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const mcpActiveRecently =
          Date.now() - this.lastMcpActivity.getTime() < this.MCP_TIMEOUT_MS;
        const secondsUntilShutdown = mcpActiveRecently
          ? null
          : Math.max(
              0,
              60 -
                Math.floor(
                  (Date.now() - this.lastMcpActivity.getTime()) / 1000,
                ),
            );

        return reply.send({
          serverRunning: true,
          mcpActive: mcpActiveRecently,
          lastMcpActivitySecondsAgo: Math.floor(
            (Date.now() - this.lastMcpActivity.getTime()) / 1000,
          ),
          secondsUntilShutdown,
          uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
          port: this.port,
          disableAnalytics: this.disableAnalytics,
        });
      },
    );

    // Keepalive endpoint for MCP clients
    this.fastify.post(
      "/api/keepalive",
      async (request: FastifyRequest, reply: FastifyReply) => {
        this.lastMcpActivity = new Date();
        this.cancelShutdownTimer(); // Cancel any pending shutdown
        logger.debug("MCP keepalive received");
        return reply.send({ status: "ok", timestamp: this.lastMcpActivity });
      },
    );

    // API routes
    this.fastify.post(
      "/api/render",
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const { diagram, background, clientId, clientName, workingDir, title } =
            request.body as any;
          const result = await renderMermaid(diagram, background);

          // Update MCP activity
          this.lastMcpActivity = new Date();
          this.cancelShutdownTimer(); // Cancel any pending shutdown

          // Save to history if successful and get the diagram ID
          let diagramId: string | undefined;
          if (result.type === "success" && workingDir && title) {
            try {
              const collection = await detectGitRepo(workingDir);
              const savedEntry = await historyService.saveDiagram(diagram, title, collection);
              diagramId = savedEntry.id;
              logger.info(`Saved diagram "${title}" with ID ${diagramId} to collection: ${collection || 'uncollected'}`);
            } catch (error) {
              logger.error("Failed to save diagram to history", { error });
              // Don't fail the render if history save fails
            }
          }

          // Always open a new browser tab for each diagram
          logger.info("Opening new browser tab for diagram", { diagramId });
          this.openBrowser(diagramId);

          return reply.send(result);
        } catch (error) {
          const errorResult: RenderResult = {
            type: "error",
            diagram: "",
            error: error instanceof Error ? error.message : "Unknown error",
          };
          return reply.code(500).send(errorResult);
        }
      },
    );

    this.fastify.post(
      "/api/validate",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { diagram } = request.body as any;
        const result = await validateMermaidSyntax(diagram);
        return reply.send(result);
      },
    );

    // History API routes
    this.fastify.get(
      "/api/history",
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const { collection } = request.query as any;
          const diagrams = await historyService.getDiagrams(collection);
          return reply.send(diagrams);
        } catch (error) {
          logger.error("Failed to get history", { error });
          return reply.code(500).send({ error: "Failed to get history" });
        }
      },
    );

    this.fastify.get(
      "/api/collections",
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const collections = await historyService.getCollections();
          return reply.send(collections);
        } catch (error) {
          logger.error("Failed to get collections", { error });
          return reply.code(500).send({ error: "Failed to get collections" });
        }
      },
    );

    this.fastify.post(
      "/api/collections",
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const { name } = request.body as any;
          await historyService.createCollection(name);
          return reply.send({ success: true });
        } catch (error) {
          logger.error("Failed to create collection", { error });
          return reply.code(500).send({ error: "Failed to create collection" });
        }
      },
    );

    this.fastify.put(
      "/api/history/:id/collection",
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const { id } = request.params as any;
          const { collection } = request.body as any;
          await historyService.moveDiagram(id, collection);
          return reply.send({ success: true });
        } catch (error) {
          logger.error("Failed to move diagram", { error });
          return reply.code(500).send({ error: "Failed to move diagram" });
        }
      },
    );

    this.fastify.patch(
      "/api/history/:id",
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const { id } = request.params as any;
          const updates = request.body as any;
          logger.info(`Updating diagram with id: ${id}`, updates);
          await historyService.updateDiagram(id, updates);
          logger.info(`Successfully updated diagram: ${id}`);
          return reply.send({ success: true });
        } catch (error) {
          logger.error("Failed to update diagram", { error, id: (request.params as any).id });
          return reply.code(500).send({ error: "Failed to update diagram" });
        }
      },
    );

    this.fastify.delete(
      "/api/history/:id",
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const { id } = request.params as any;
          logger.info(`Deleting diagram with id: ${id}`);
          await historyService.deleteDiagram(id);
          logger.info(`Successfully deleted diagram: ${id}`);
          return reply.send({ success: true });
        } catch (error) {
          logger.error("Failed to delete diagram", { error, id: (request.params as any).id });
          return reply.code(500).send({ error: "Failed to delete diagram" });
        }
      },
    );
  }


  private async openBrowser(diagramId?: string) {
    const isProduction = process.env.NODE_ENV !== "development";
    const baseUrl = isProduction
      ? `http://localhost:${this.port}`
      : `http://localhost:5173`;
    
    const url = diagramId ? `${baseUrl}/artifact/${diagramId}` : baseUrl;

    try {
      await open(url);
      logger.info("Opened browser", { url, diagramId });
    } catch (error) {
      logger.error("Failed to open browser", { error });
    }
  }

  private checkForShutdown() {
    // Only check MCP activity for shutdown
    const mcpInactive =
      Date.now() - this.lastMcpActivity.getTime() >= this.MCP_TIMEOUT_MS;

    if (mcpInactive) {
      logger.info(
        `No recent MCP activity. Server will shut down in ${this.SHUTDOWN_DELAY_MS / 1000} seconds...`,
      );

      this.shutdownTimer = setTimeout(() => {
        // Double-check MCP activity before shutdown
        const stillMcpInactive =
          Date.now() - this.lastMcpActivity.getTime() >= this.MCP_TIMEOUT_MS;

        if (stillMcpInactive) {
          logger.info("Shutting down singleton server - MCP client inactive");
          this.stop();
        } else {
          logger.info("Shutdown cancelled - MCP activity detected");
        }
      }, this.SHUTDOWN_DELAY_MS);
    }
  }

  private cancelShutdownTimer() {
    if (this.shutdownTimer) {
      clearTimeout(this.shutdownTimer);
      this.shutdownTimer = null;
    }
  }

  async stop(): Promise<void> {
    this.cancelShutdownTimer();

    if (this.fastify) {
      await this.fastify.close();
      this.fastify = null;
    }

    process.exit(0);
  }

  async openUI(
    autoOpen: boolean = true,
  ): Promise<{ url: string; message: string }> {
    const isProduction = process.env.NODE_ENV !== "development";
    const url = isProduction
      ? `http://localhost:${this.port}`
      : `http://localhost:5173`;

    const message = isProduction
      ? `Mindpilot UI is available at ${url}`
      : `Mindpilot UI is available at ${url} (development mode)`;

    if (autoOpen) {
      try {
        const platform = process.platform;
        let command: string;
        let args: string[];

        if (platform === "darwin") {
          command = "open";
          args = [url];
        } else if (platform === "win32") {
          command = "cmd";
          args = ["/c", "start", url];
        } else {
          command = "xdg-open";
          args = [url];
        }

        spawn(command, args, { detached: true, stdio: "ignore" }).unref();
      } catch (error) {
        logger.error("Failed to open browser", { error });
      }
    }

    return { url, message };
  }

  isRunning(): boolean {
    return this.fastify !== null;
  }

  getPort(): number {
    return this.port;
  }
}

// Helper function to check if a server is already running on a port
export async function isPortInUse(port: number, signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/api/status`, { signal });
    return response.ok;
  } catch {
    return false;
  }
}

// Start singleton server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { parseArgs } = await import('node:util');
  
  // Increase max listeners to prevent warnings
  setMaxListeners(20, process);
  
  const { values } = parseArgs({
    options: {
      port: {
        type: 'string',
        short: 'p',
        default: '4000'
      },
      'disable-analytics': {
        type: 'boolean',
        default: false
      }
    }
  });
  
  const port = parseInt(values.port!, 10);
  const server = new SingletonHTTPServer(port, values['disable-analytics'] as boolean);

  server.start().catch((error) => {
    logger.error("Failed to start server", { error });
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Shutting down server (SIGINT/SIGTERM)");
    await server.stop();
  });

  process.on("SIGTERM", async () => {
    logger.info("Shutting down server (SIGINT/SIGTERM)");
    await server.stop();
  });
}
