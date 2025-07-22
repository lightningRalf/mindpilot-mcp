import { useState, useEffect } from 'react';

export function useQueryParam(paramName: string): string | null {
  const [value, setValue] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(paramName);
  });

  useEffect(() => {
    const checkParam = () => {
      const searchParams = new URLSearchParams(window.location.search);
      setValue(searchParams.get(paramName));
    };

    // Check on mount and when URL changes
    checkParam();
    
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', checkParam);
    
    return () => {
      window.removeEventListener('popstate', checkParam);
    };
  }, [paramName]);

  return value;
}

export function useFeatureFlag(flagName: string): boolean {
  const paramValue = useQueryParam(flagName);
  return paramValue === '1';
}