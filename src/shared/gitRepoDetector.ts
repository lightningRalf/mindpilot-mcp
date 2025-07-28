import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { httpLogger as logger } from './logger.js';

const execAsync = promisify(exec);

/**
 * Detects if we're in a git repository and returns the repo name.
 * 
 * @param workingDir The directory where the diagram is being created
 * @returns Repository name or null if not in a git repo
 */
export async function detectGitRepo(workingDir: string): Promise<string | null> {
  try {
    // Try to get git repository root
    const { stdout } = await execAsync('git rev-parse --show-toplevel', { 
      cwd: workingDir,
      timeout: 5000 // 5 second timeout
    });
    
    const repoRoot = stdout.trim();
    
    if (repoRoot) {
      // Extract repository name from path
      const repoName = path.basename(repoRoot);
      
      logger.debug(`Detected git repository: ${repoName} at ${repoRoot}`);
      
      return sanitizeCollectionName(repoName);
    }
  } catch (error) {
    // Not a git repo or git not installed
    logger.debug(`No git repository detected in ${workingDir}`);
  }
  
  return null;
}

/**
 * Sanitizes a collection name to be safe for filesystem use.
 * @param name The collection name to sanitize
 * @returns A filesystem-safe version of the name
 */
export function sanitizeCollectionName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '-')  // Replace special chars with hyphens
    .replace(/--+/g, '-')              // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')             // Remove leading/trailing hyphens
    .toLowerCase();
}