import { Server } from "@modelcontextprotocol/sdk/server/index.js";

type LogLevel =
  | "debug"
  | "info"
  | "notice"
  | "warning"
  | "error"
  | "critical"
  | "alert"
  | "emergency";

const isDebugMode =
  process.env.MINDPILOT_DEBUG === "true" || process.argv.includes("--debug");

/**
 * MCP-compliant logger that works for all subsystems.
 * - When MCP server is available: sends logs through MCP protocol
 * - Otherwise: writes to stderr (never stdout to avoid protocol contamination)
 */
class MCPLogger {
  private mcpServer?: Server;
  private name: string;
  private debugMode: boolean;

  constructor(name: string) {
    this.name = name;
    this.debugMode = isDebugMode;
  }

  setMcpServer(server: Server) {
    this.mcpServer = server;
  }

  private log(level: LogLevel, message: string, metadata?: any) {
    const timestamp = new Date().toISOString();

    if (this.mcpServer) {
      // Send through MCP protocol
      this.mcpServer
        .sendLoggingMessage({
          level,
          logger: this.name,
          data: metadata ? { message, ...metadata } : message,
        })
        .catch((err) => {
          // Fallback to stderr if MCP logging fails
          console.error(
            `[${timestamp}] [${this.name}] [${level}] ${message}`,
            metadata || "",
          );
        });
    } else {
      // Write to stderr (never stdout!)
      const logMessage = metadata
        ? `[${timestamp}] [${this.name}] [${level}] ${message} ${JSON.stringify(metadata)}`
        : `[${timestamp}] [${this.name}] [${level}] ${message}`;
      console.error(logMessage);
    }
  }

  debug(message: string, metadata?: any) {
    if (this.debugMode) {
      this.log("debug", message, metadata);
    }
  }

  info(message: string, metadata?: any) {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log("warning", message, metadata);
  }

  error(message: string, metadata?: any) {
    this.log("error", message, metadata);
  }

  critical(message: string, metadata?: any) {
    this.log("critical", message, metadata);
  }
}

// Create logger instances for different subsystems
export const httpLogger = new MCPLogger("http-server");
export const mcpLogger = new MCPLogger("mcp-client");

// Log debug mode status
if (isDebugMode) {
  httpLogger.info("Debug mode enabled");
  mcpLogger.info("Debug mode enabled");
}
