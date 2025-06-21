import { useState, useEffect, useRef, useCallback } from 'react';

// Connection states
type ConnectionState = 
  | 'disconnected'
  | 'connecting' 
  | 'connected'
  | 'reconnecting'
  | 'failed';

// Events that can trigger state transitions
type ConnectionEvent =
  | { type: 'CONNECT' }
  | { type: 'CONNECTION_SUCCESS' }
  | { type: 'CONNECTION_ERROR' }
  | { type: 'CONNECTION_CLOSED' }
  | { type: 'RECONNECT' }
  | { type: 'MAX_RETRIES_REACHED' };

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  keepAliveInterval?: number;
}

interface UseWebSocketReturn {
  state: ConnectionState;
  isConnected: boolean;
  reconnect: () => void;
  send: (data: any) => void;
}

export function useWebSocketStateMachine({
  url,
  onMessage,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  keepAliveInterval = 30000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [state, setState] = useState<ConnectionState>('disconnected');
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const urlRef = useRef(url);
  const onMessageRef = useRef(onMessage);
  
  // Update refs when props change
  useEffect(() => {
    urlRef.current = url;
    onMessageRef.current = onMessage;
  }, [url, onMessage]);

  // State machine transition function
  const transition = useCallback((event: ConnectionEvent) => {
    console.log(`[WebSocket FSM] Event: ${event.type}, Current State: ${state}`);
    
    switch (state) {
      case 'disconnected':
        if (event.type === 'CONNECT') {
          setState('connecting');
          return 'connecting';
        }
        break;
        
      case 'connecting':
        if (event.type === 'CONNECTION_SUCCESS') {
          setState('connected');
          reconnectAttemptsRef.current = 0;
          return 'connected';
        }
        if (event.type === 'CONNECTION_ERROR' || event.type === 'CONNECTION_CLOSED') {
          setState('reconnecting');
          return 'reconnecting';
        }
        break;
        
      case 'connected':
        if (event.type === 'CONNECTION_CLOSED' || event.type === 'CONNECTION_ERROR') {
          setState('reconnecting');
          reconnectAttemptsRef.current = 0; // Reset attempts for fresh disconnect
          return 'reconnecting';
        }
        break;
        
      case 'reconnecting':
        if (event.type === 'RECONNECT') {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            setState('connecting');
            return 'connecting';
          } else {
            setState('failed');
            return 'failed';
          }
        }
        if (event.type === 'CONNECTION_SUCCESS') {
          setState('connected');
          reconnectAttemptsRef.current = 0;
          return 'connected';
        }
        break;
        
      case 'failed':
        if (event.type === 'RECONNECT' || event.type === 'CONNECT') {
          reconnectAttemptsRef.current = 0; // Reset on manual reconnect
          setState('connecting');
          return 'connecting';
        }
        break;
    }
    
    return state; // No transition
  }, [state, maxReconnectAttempts]);

  // WebSocket connection logic
  const connect = useCallback(() => {
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Don't connect if already connected/connecting
    if (websocketRef.current && 
        (websocketRef.current.readyState === WebSocket.CONNECTING || 
         websocketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    console.log(`[WebSocket] Connecting to ${urlRef.current}`);
    
    try {
      const ws = new WebSocket(urlRef.current);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        transition({ type: 'CONNECTION_SUCCESS' });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        transition({ type: 'CONNECTION_CLOSED' });
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        transition({ type: 'CONNECTION_ERROR' });
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket:', error);
      transition({ type: 'CONNECTION_ERROR' });
      scheduleReconnect();
    }
  }, [transition]);

  // Schedule reconnection based on current state
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return; // Already scheduled
    
    const isInFailedState = state === 'failed';
    const delay = isInFailedState ? keepAliveInterval : reconnectInterval;
    
    if (!isInFailedState) {
      reconnectAttemptsRef.current++;
    }
    
    console.log(`[WebSocket] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      const newState = transition({ type: 'RECONNECT' });
      if (newState === 'connecting') {
        connect();
      } else if (newState === 'failed') {
        // Schedule next attempt after transitioning to failed state
        scheduleReconnect();
      }
    }, delay);
  }, [state, reconnectInterval, keepAliveInterval, transition, connect]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('[WebSocket] Manual reconnect requested');
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (websocketRef.current && websocketRef.current.readyState !== WebSocket.CLOSED) {
      websocketRef.current.close();
    }
    
    const newState = transition({ type: 'CONNECT' });
    if (newState === 'connecting') {
      connect();
    }
  }, [transition, connect]);

  // Send message function
  const send = useCallback((data: any) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }, []);

  // Handle state changes
  useEffect(() => {
    if (state === 'connecting') {
      connect();
    }
  }, [state, connect]);

  // Initial connection
  useEffect(() => {
    transition({ type: 'CONNECT' });
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (websocketRef.current && websocketRef.current.readyState !== WebSocket.CLOSED) {
        websocketRef.current.close();
      }
    };
  }, []);

  return {
    state,
    isConnected: state === 'connected',
    reconnect,
    send,
  };
}