import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  keepAliveInterval?: number; // Continue trying every X ms after max attempts
}

interface UseWebSocketReturn {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnect: () => void;
  send: (data: any) => void;
}

export function useWebSocket({
  url,
  onMessage,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  keepAliveInterval = 30000, // 30 seconds
}: UseWebSocketOptions): UseWebSocketReturn {
  const [connectionStatus, setConnectionStatus] = useState<UseWebSocketReturn['connectionStatus']>('connecting');
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const urlRef = useRef(url);
  const onMessageRef = useRef(onMessage);
  
  // Update refs when props change
  useEffect(() => {
    urlRef.current = url;
    onMessageRef.current = onMessage;
  }, [url, onMessage]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Skip if already connected or connecting
    if (websocketRef.current && 
        (websocketRef.current.readyState === WebSocket.CONNECTING || 
         websocketRef.current.readyState === WebSocket.OPEN)) {
      console.log('[WebSocket] Already connected or connecting, skipping...');
      return;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log('[WebSocket] Starting connection attempt to:', urlRef.current);
    console.log('[WebSocket] Attempt #', reconnectAttemptsRef.current + 1, 'of', maxReconnectAttempts);
    setConnectionStatus('connecting');
    
    try {
      const ws = new WebSocket(urlRef.current);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully to:', urlRef.current);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        // Clear any pending reconnect on successful connection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        
        console.log('[WebSocket] Connection closed:', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
          url: urlRef.current
        });
        setConnectionStatus('disconnected');
        
        // Only schedule reconnect if we don't already have one pending
        if (!reconnectTimeoutRef.current) {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            // Initial reconnection attempts with shorter interval
            reconnectAttemptsRef.current++;
            const delay = reconnectInterval;
            console.log(`[WebSocket] Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          } else {
            // After max attempts, keep trying every 30 seconds
            setConnectionStatus('error');
            console.log(`[WebSocket] Max attempts (${maxReconnectAttempts}) reached, will retry every ${keepAliveInterval/1000}s`);
            reconnectTimeoutRef.current = setTimeout(connect, keepAliveInterval);
          }
        } else {
          console.log('[WebSocket] Reconnect already scheduled, skipping...');
        }
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        console.error('WebSocket error:', error);
        // Don't set error status here - let onclose handle it
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('error');
      // Schedule reconnect on creation failure
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    }
  }, [url, onMessage, reconnectInterval, maxReconnectAttempts, keepAliveInterval]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    connect();
  }, [connect]);

  const send = useCallback((data: any) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Initial connection
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Don't close the WebSocket here to prevent React StrictMode issues
      // The connection will be reused if the component remounts quickly
    };
  }, []); // Remove connect from dependencies to prevent recreation
  
  // Cleanup WebSocket on unmount (with delay to handle StrictMode)
  useEffect(() => {
    return () => {
      // Delay cleanup to see if component remounts (React StrictMode)
      setTimeout(() => {
        if (!mountedRef.current && websocketRef.current && websocketRef.current.readyState !== WebSocket.CLOSED) {
          console.log('[WebSocket] Closing connection on unmount');
          websocketRef.current.close();
        }
      }, 100);
    };
  }, []);

  return { connectionStatus, reconnect, send };
}