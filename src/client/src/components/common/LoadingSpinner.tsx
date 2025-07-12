import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  fullScreen?: boolean;
  color?: 'blue' | 'orange' | 'gray' | 'green' | 'red';
}

const sizeConfig = {
  xs: { spinner: 'w-3 h-3', text: 'text-xs' },
  sm: { spinner: 'w-4 h-4', text: 'text-sm' },
  md: { spinner: 'w-6 h-6', text: 'text-base' },
  lg: { spinner: 'w-8 h-8', text: 'text-lg' },
  xl: { spinner: 'w-12 h-12', text: 'text-xl' },
};

const colorConfig = {
  blue: 'text-blue-500 dark:text-blue-400',
  orange: 'text-orange-500 dark:text-orange-400',
  gray: 'text-neutral-500 dark:text-neutral-400',
  green: 'text-green-500 dark:text-green-400',
  red: 'text-red-500 dark:text-red-400',
};

export function LoadingSpinner({
  size = 'md',
  message,
  className,
  fullScreen = false,
  color = 'blue',
}: LoadingSpinnerProps) {
  const config = sizeConfig[size];
  const spinnerColor = colorConfig[color];

  const spinner = (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        config.spinner,
        spinnerColor
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );

  const content = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {spinner}
      {message && (
        <span className={cn(config.text, 'text-neutral-600 dark:text-neutral-400')}>
          {message}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
}
