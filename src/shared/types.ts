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

export interface ServerStatus {
  running: boolean;
  port: number;
  uptime: number;
}

// History types
export interface DiagramHistoryEntry {
  version: number;  // Data format version
  id: string;
  type: string;  // Type field for future expansion (diagram, template, shared, etc.)
  createdAt: Date;
  updatedAt: Date;
  diagram: string;
  title: string;  // Required title
  collection: string | null;  // repo name, user collection, or null
}