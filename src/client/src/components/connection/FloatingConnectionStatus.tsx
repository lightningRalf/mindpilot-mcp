import { MCPServerStatus } from './MCPServerStatus';


interface FloatingConnectionStatusProps {
  isVisible: boolean;
  connectionStatus: string;
  onReconnect: () => void;
  isDarkMode: boolean;
  className?: string;
}

export function FloatingConnectionStatus({
  isVisible,
  connectionStatus,
  onReconnect,
  isDarkMode,
  className = ''
}: FloatingConnectionStatusProps) {
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
}

