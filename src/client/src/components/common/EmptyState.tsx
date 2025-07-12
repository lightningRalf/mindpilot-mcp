import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    icon: 'w-8 h-8',
    title: 'text-sm',
    description: 'text-xs',
    spacing: 'gap-2',
    padding: 'p-4',
  },
  md: {
    icon: 'w-12 h-12',
    title: 'text-base',
    description: 'text-sm',
    spacing: 'gap-3',
    padding: 'p-6',
  },
  lg: {
    icon: 'w-16 h-16',
    title: 'text-lg',
    description: 'text-base',
    spacing: 'gap-4',
    padding: 'p-8',
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        config.padding,
        config.spacing,
        className
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            config.icon,
            'text-neutral-400 dark:text-neutral-600'
          )}
        />
      )}

      <div className={cn('space-y-1', size === 'sm' && 'space-y-0.5')}>
        <h3
          className={cn(
            config.title,
            'font-medium text-neutral-600 dark:text-neutral-400'
          )}
        >
          {title}
        </h3>

        {description && (
          <p
            className={cn(
              config.description,
              'text-neutral-500 dark:text-neutral-500'
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            'text-orange-600 hover:text-orange-700 hover:bg-orange-50',
            'dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20',
            'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
            'dark:focus:ring-offset-neutral-800'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
