export interface RenderResult {
  type: "success" | "error";
  diagram: string;
  svg?: string;
  error?: string;
  details?: string;
  background?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface MCPClient {
  id: string;
  name: string;
  connectedAt: Date;
  lastActivity: Date;
}

export interface DiagramBroadcast {
  type: "render_result";
  clientId?: string;
  clientName?: string;
  diagram: string;
  title?: string;
  svg?: string;
  error?: string;
  details?: string;
  background?: string;
}

export interface ServerStatus {
  running: boolean;
  port: number;
  clients: MCPClient[];
  uptime: number;
}

export interface ClientMessage {
  type: "render" | "validate" | "register" | "unregister" | "ping" | "visibility_response";
  clientId?: string;
  clientName?: string;
  diagram?: string;
  background?: string;
  isVisible?: boolean;
}

export interface ServerMessage {
  type: "render_result" | "validation_result" | "registered" | "error" | "pong" | "visibility_query";
  clientId?: string;
  result?: RenderResult | ValidationResult;
  error?: string;
}

// History types
export interface DiagramHistoryEntry {
  id: string;
  type: string;  // Type field for future expansion (diagram, template, shared, etc.)
  timestamp: Date;
  lastEdited: Date;
  diagram: string;
  title: string;  // Required title
  collection: string | null;  // repo name, user collection, or null
}