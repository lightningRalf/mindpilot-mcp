import React from 'react';
import { BRANDING } from '@/constants/app';

interface BrandingProps {
  className?: string;
}

export const Branding: React.FC<BrandingProps> = ({ className = '' }) => {
  return (
    <div
      className={`absolute bottom-4 right-6 pointer-events-none flex items-center ${className}`}
      style={{ height: '42px' }}
    >
      <div className="text-1 text-xs font-normal text-right text-neutral-500 dark:text-gray-400">
        {BRANDING.displayName}
      </div>
    </div>
  );
};

export default Branding;
