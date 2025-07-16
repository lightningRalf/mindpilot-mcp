import { ReactNode } from 'react';
import { DiagramProvider } from './DiagramContext';
import { ThemeProvider } from './ThemeContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <DiagramProvider>
        {children}
      </DiagramProvider>
    </ThemeProvider>
  );
}