import React from 'react';
import { MCPServerStatus } from '@/components/MCPServerStatus';


interface FloatingConnectionStatusProps {
  isVisible: boolean;
  connectionStatus: string;
  onReconnect: () => void;
  isDarkMode: boolean;
  className?: string;
}

export const FloatingConnectionStatus: React.FC<FloatingConnectionStatusProps> = ({
  isVisible,
  connectionStatus,
  onReconnect,
  isDarkMode,
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`absolute bottom-4 left-6 ${className}`}
    >

      <MCPServerStatus
        connectionStatus={connectionStatus}
        onReconnect={onReconnect}
        isDarkMode={isDarkMode}
        isCollapsedView={true}
      />
    </div>
  );
};

export default FloatingConnectionStatus;
