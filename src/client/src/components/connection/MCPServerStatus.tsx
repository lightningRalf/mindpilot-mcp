
interface MCPServerStatusProps {
  connectionStatus: string;
  onReconnect: () => void;
  isDarkMode?: boolean;
  isCollapsedView?: boolean;
}

import { StatusIndicator, StatusType } from '../common';

export function MCPServerStatus({
  connectionStatus,
  onReconnect,
  isCollapsedView = false,
}: MCPServerStatusProps) {
  const isDisconnected = connectionStatus === "Disconnected" ||
    connectionStatus === "Connection error" ||
    connectionStatus === "Connection timed out";

  // Remove countdown timer from reconnecting status
  const displayStatus = connectionStatus.startsWith("Reconnecting")
    ? "Reconnecting"
    : connectionStatus;

  // Map connection status to StatusType
  const statusType: StatusType = connectionStatus === "Connected"
    ? "connected"
    : connectionStatus.startsWith("Reconnecting")
      ? "reconnecting"
      : "disconnected";

  // Panel view (inside editor panel)
  if (!isCollapsedView) {
    return (
      <div className="flex items-center gap-2">
        <StatusIndicator status={statusType} size="sm" />
        {isDisconnected ? (
          <button
            onClick={onReconnect}
            className="text-xs underline hover:text-sky-500 dark:hover:text-sky-300 transition-colors"
          >
            Reconnect
          </button>
        ) : (
          <span className="text-xs">{displayStatus}</span>
        )}
      </div>
    );
  }

  // Collapsed view (floating button)
  if (isDisconnected) {
    return (
      <button
        onClick={onReconnect}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <StatusIndicator status="disconnected" size="sm" />
        <span className="text-xs font-normal text-neutral-500 dark:text-gray-400">Reconnect</span>
      </button>
    );
  }

  // Connected/Reconnecting states in collapsed view
  return (
    <div className="flex items-center gap-2">
      <StatusIndicator status={statusType} size="sm" />
      <span className="text-xs font-normal text-neutral-500 dark:text-gray-400">{displayStatus}</span>
    </div>
  );
}
