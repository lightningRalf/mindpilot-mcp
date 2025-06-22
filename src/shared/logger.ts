import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Check if debug mode is enabled via environment variable or flag
const isDebugMode = process.env.MINDPILOT_DEBUG === 'true' || process.argv.includes('--debug');

const LOG_DIR = path.join(os.homedir(), '.mindpilot', 'logs');

// Create log directory only if debug mode is enabled
if (isDebugMode) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create base transports array
const httpTransports: winston.transport[] = [
  // Console transport always enabled
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}] ${message}`;
        if (Object.keys(metadata).length > 1) {
          msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
      })
    )
  })
];

// Add file transport only in debug mode
if (isDebugMode) {
  httpTransports.push(
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'http-server-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

// Create a logger instance for HTTP server
export const httpLogger = winston.createLogger({
  level: isDebugMode ? 'debug' : (process.env.LOG_LEVEL || 'info'),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'http-server' },
  transports: httpTransports
});

// Create base transports array for MCP
const mcpTransports: winston.transport[] = [
  // Console transport always enabled
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}] ${message}`;
        if (Object.keys(metadata).length > 1) {
          msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
      })
    )
  })
];

// Add file transport only in debug mode
if (isDebugMode) {
  mcpTransports.push(
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'mcp-client-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

// Create a logger instance for MCP client
export const mcpLogger = winston.createLogger({
  level: isDebugMode ? 'debug' : (process.env.LOG_LEVEL || 'info'),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-client' },
  transports: mcpTransports
});

// Handle errors in winston
httpLogger.on('error', (error) => {
  console.error('Winston logger error:', error);
});

mcpLogger.on('error', (error) => {
  console.error('Winston logger error:', error);
});

// Log debug mode status
if (isDebugMode) {
  httpLogger.info('Debug mode enabled - file logging active', { logDir: LOG_DIR });
  mcpLogger.info('Debug mode enabled - file logging active', { logDir: LOG_DIR });
}