import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { DiagramHistoryEntry } from './types.js';
import { httpLogger as logger } from './logger.js';

export class HistoryService {
  private baseDir: string;
  private dataDir: string;

  constructor() {
    this.baseDir = path.join(os.homedir(), '.mindpilot');
    this.dataDir = path.join(this.baseDir, 'data');
  }

  /**
   * Ensures the necessary directories exist
   */
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  /**
   * Saves a diagram to history
   */
  async saveDiagram(diagram: string, title: string, collection: string | null): Promise<DiagramHistoryEntry> {
    await this.ensureDirectories();

    const now = new Date();
    const entry: DiagramHistoryEntry = {
      id: uuidv4(),
      type: 'diagram',
      timestamp: now,
      lastEdited: now,
      diagram,
      title,
      collection
    };

    // Save to data directory
    const filePath = path.join(this.dataDir, `${entry.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));

    logger.info(`Saved diagram ${entry.id} with collection: ${collection || 'uncategorized'}`);

    return entry;
  }

  /**
   * Gets all diagrams, optionally filtered by collection
   */
  async getDiagrams(collection?: string | null): Promise<DiagramHistoryEntry[]> {
    await this.ensureDirectories();

    const diagrams: DiagramHistoryEntry[] = [];

    try {
      const files = await fs.readdir(this.dataDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.dataDir, file), 'utf-8');
          const rawEntry = JSON.parse(content);
          
          // Handle missing fields for backward compatibility
          const entry: DiagramHistoryEntry = {
            ...rawEntry,
            type: rawEntry.type || 'diagram',  // Default to 'diagram' for old files
            timestamp: new Date(rawEntry.timestamp),
            lastEdited: new Date(rawEntry.lastEdited || rawEntry.timestamp)
          };
          
          // Filter by collection if specified
          if (collection !== undefined) {
            if (collection === entry.collection) {
              diagrams.push(entry);
            }
          } else {
            // Return all diagrams
            diagrams.push(entry);
          }
        }
      }
    } catch (error) {
      logger.debug('No diagrams found');
    }

    // Sort by timestamp, newest first
    return diagrams.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Gets a list of all collections
   */
  async getCollections(): Promise<string[]> {
    await this.ensureDirectories();

    const collectionsSet = new Set<string>();

    try {
      const files = await fs.readdir(this.dataDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.dataDir, file), 'utf-8');
          const rawEntry = JSON.parse(content);
          
          if (rawEntry.collection) {
            collectionsSet.add(rawEntry.collection);
          }
        }
      }
    } catch (error) {
      logger.debug('No diagrams found');
    }

    return Array.from(collectionsSet).sort();
  }

  /**
   * Moves a diagram to a different collection
   */
  async moveDiagram(diagramId: string, newCollection: string | null): Promise<void> {
    const filePath = path.join(this.dataDir, `${diagramId}.json`);
    
    try {
      // Read the raw file content directly
      const content = await fs.readFile(filePath, 'utf-8');
      const rawEntry = JSON.parse(content);
      
      // Update the collection
      rawEntry.collection = newCollection;
      
      // Write back the updated entry
      await fs.writeFile(filePath, JSON.stringify(rawEntry, null, 2));
      
      logger.info(`Updated diagram ${diagramId} to collection: ${newCollection || 'uncategorized'}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Diagram ${diagramId} not found`);
      }
      throw error;
    }
  }

  /**
   * Creates a new collection
   */
  async createCollection(name: string): Promise<void> {
    // Collections are now just metadata within diagram files
    // No directory to create, but we'll keep this method for API compatibility
    logger.info(`Collection '${name}' will be created when first diagram is added`);
  }

  /**
   * Updates a diagram's properties (title, collection, etc.)
   */
  async updateDiagram(diagramId: string, updates: Partial<Pick<DiagramHistoryEntry, 'title' | 'collection' | 'diagram'>>): Promise<void> {
    const filePath = path.join(this.dataDir, `${diagramId}.json`);
    
    try {
      // Read the raw file content directly
      const content = await fs.readFile(filePath, 'utf-8');
      const rawEntry = JSON.parse(content);
      
      // Update the specified fields
      if (updates.title !== undefined) {
        rawEntry.title = updates.title;
      }
      if (updates.collection !== undefined) {
        rawEntry.collection = updates.collection;
      }
      if (updates.diagram !== undefined) {
        rawEntry.diagram = updates.diagram;
      }
      
      // Update lastEdited timestamp
      rawEntry.lastEdited = new Date().toISOString();
      
      // Write back the updated entry
      await fs.writeFile(filePath, JSON.stringify(rawEntry, null, 2));
      
      logger.info(`Updated diagram ${diagramId}:`, updates);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Diagram ${diagramId} not found`);
      }
      throw error;
    }
  }

  /**
   * Deletes a diagram by ID
   */
  async deleteDiagram(diagramId: string): Promise<void> {
    const filePath = path.join(this.dataDir, `${diagramId}.json`);
    
    try {
      await fs.unlink(filePath);
      logger.info(`Deleted diagram: ${diagramId}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Diagram ${diagramId} not found`);
      }
      throw error;
    }
  }
}

// Singleton instance
export const historyService = new HistoryService();