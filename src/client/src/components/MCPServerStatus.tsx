
interface MCPServerStatusProps {
  connectionStatus: string;
  onReconnect: () => void;
  isDarkMode?: boolean;
  isCollapsedView?: boolean;
}

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

  // Panel view (inside editor panel)
  if (!isCollapsedView) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            connectionStatus === "Connected"
              ? "bg-green-500"
              : connectionStatus.startsWith("Reconnecting")
                ? "bg-yellow-500 animate-pulse"
                : "bg-red-500"
          }`}
        />
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
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs font-normal text-neutral-500 dark:text-gray-400">Reconnect</span>
      </button>
    );
  }

  // Connected/Reconnecting states in collapsed view
  return (
    <div
      className="flex items-center gap-2"
    >
      <div
        className={`w-2 h-2 rounded-full ${
          connectionStatus === "Connected"
            ? "bg-green-500"
            : "bg-yellow-500 animate-pulse"
        }`}
      />
      <span className="text-xs font-normal text-neutral-500 dark:text-gray-400">{displayStatus}</span>
    </div>
  );
}
