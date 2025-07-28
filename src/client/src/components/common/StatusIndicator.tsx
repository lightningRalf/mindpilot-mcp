import { cn } from '../../lib/utils';

export type StatusType = 'connected' | 'disconnected' | 'reconnecting' | 'error' | 'warning' | 'info';

export interface StatusIndicatorProps {
  status: StatusType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  pulse?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; defaultLabel: string }> = {
  connected: { color: 'bg-green-500', defaultLabel: 'Connected' },
  disconnected: { color: 'bg-red-500', defaultLabel: 'Disconnected' },
  reconnecting: { color: 'bg-yellow-500', defaultLabel: 'Reconnecting' },
  error: { color: 'bg-red-500', defaultLabel: 'Error' },
  warning: { color: 'bg-yellow-500', defaultLabel: 'Warning' },
  info: { color: 'bg-blue-500', defaultLabel: 'Info' },
};

const sizeConfig = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function StatusIndicator({
  status,
  size = 'sm',
  showLabel = false,
  label,
  pulse = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;
  const shouldPulse = pulse || status === 'reconnecting';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full',
          sizeConfig[size],
          config.color,
          shouldPulse && 'animate-pulse'
        )}
        aria-label={displayLabel}
      />
      {showLabel && (
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          {displayLabel}
        </span>
      )}
    </div>
  );
}