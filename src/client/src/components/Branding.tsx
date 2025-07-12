import { BRANDING } from '@/constants/app';

interface BrandingProps {
  className?: string;
}

export function Branding({ className = '' }: BrandingProps) {
  return (
    <div className={`pointer-events-none flex items-center ${className}`}>
      <div className="text-m font-normal text-neutral-500 dark:text-gray-400">
        {BRANDING.displayName}
      </div>
    </div>
  );
}

