import { ReactNode } from 'react';
import { DiagramProvider } from './DiagramContext';
import { WebSocketProvider } from './WebSocketContext';
import { ThemeProvider } from './ThemeContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <DiagramProvider>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </DiagramProvider>
    </ThemeProvider>
  );
}