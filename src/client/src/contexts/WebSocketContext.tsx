import { createContext, useContext, ReactNode } from 'react';
import { useMcpServerWebSocket } from '@/hooks/useMcpServerWebSocket';

export interface WebSocketContextValue {
  connectionStatus: string;
  isConnected: boolean;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ 
  children
}: WebSocketProviderProps) {
  const { connectionStatus, isConnected, reconnect } = useMcpServerWebSocket();

  const value: WebSocketContextValue = {
    connectionStatus,
    isConnected,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}