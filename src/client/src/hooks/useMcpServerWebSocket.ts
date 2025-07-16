import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useWebSocketStateMachine } from './useWebSocketStateMachine';

export interface UseMcpServerWebSocketReturn {
  connectionStatus: string;
  isConnected: boolean;
  reconnect: () => void;
}

/**
 * High-level WebSocket hook for connecting to the MCP server
 * Handles WebSocket connection to port 4000 and basic connectivity
 */
export function useMcpServerWebSocket(): UseMcpServerWebSocketReturn {
  // Determine WebSocket URL based on environment
  const wsUrl = useMemo(() => {
    const currentPort = window.location.port;
    const isDev = currentPort === "5173";

    // In dev mode, always connect to port 4000 (MCP server)
    // In production, use the same port as the page
    const url = isDev
      ? `ws://${window.location.hostname}:4000/ws`
      : `ws://${window.location.hostname}:${window.location.port}/ws`;

    console.log('[WebSocket Setup]', {
      isDev,
      currentPort,
      hostname: window.location.hostname,
      wsUrl: url,
      fullUrl: window.location.href,
      note: isDev ? 'Dev mode - connecting to MCP server on port 4000' : 'Production mode - using same port'
    });

    return url;
  }, []); // Empty deps - URL shouldn't change during the session

  // Store send function in a ref to avoid circular dependency
  const sendRef = useRef<(data: any) => void>(() => {});

  // Use the WebSocket state machine
  const { state, reconnect, send } = useWebSocketStateMachine({
    url: wsUrl,
    onMessage: useCallback((data: any) => {
      console.log('[WebSocket Message]', data);
      
      // We no longer handle render_result messages since each diagram opens in a new tab
      // Only handle ping/pong or other control messages if needed
    }, []),
  });
  
  // Update sendRef with actual send function
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  // Map state machine states to UI-friendly status messages
  const connectionStatus = useMemo(() => {
    switch (state) {
      case 'connected': return 'Connected to MCP host';
      case 'connecting': return 'Connecting...';
      case 'reconnecting': return 'Reconnecting...';
      case 'failed': return 'Disconnected';
      case 'disconnected': return 'Disconnected';
      default: return 'Disconnected';
    }
  }, [state]);

  const isConnected = state === 'connected';

  return {
    connectionStatus,
    isConnected,
    reconnect,
  };
}