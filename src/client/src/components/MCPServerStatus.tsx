import { Button } from "@/components/ui/button";

interface MCPServerStatusProps {
  connectionStatus: string;
  onReconnect: () => void;
}

export function MCPServerStatus({
  connectionStatus,
  onReconnect,
}: MCPServerStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${
            connectionStatus === "Connected"
              ? "bg-green-500"
              : connectionStatus === "Connecting..." ||
                  connectionStatus.startsWith("Reconnecting")
                ? "bg-yellow-500 animate-pulse"
                : "bg-red-500"
          }`}
        />
        <span className="text-xs pr-3">{connectionStatus}</span>
      </div>
      {(connectionStatus === "Disconnected" ||
        connectionStatus === "Connection error" ||
        connectionStatus === "Connection timed out") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReconnect}
          className="h-6 px-2 text-xs"
        >
          Reconnect
        </Button>
      )}
    </div>
  );
}
