import React from 'react';
import { BRANDING } from '@/constants/app';

interface BrandingProps {
  className?: string;
}

export const Branding: React.FC<BrandingProps> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none flex items-center ${className}`}>
      <div className="text-m font-normal text-neutral-500 dark:text-gray-400">
        {BRANDING.displayName}
      </div>
    </div>
  );
};

export default Branding;
