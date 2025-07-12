import React, { ReactNode } from 'react';
import { DiagramProvider, useDiagramContext } from './DiagramContext';
import { WebSocketProvider } from './WebSocketContext';
import { ThemeProvider } from './ThemeContext';

interface AppProvidersProps {
  children: ReactNode;
}

// Inner component that has access to DiagramContext
function WebSocketProviderWithDiagramContext({ children }: { children: ReactNode }) {
  const { setDiagram, setTitle, setStatus } = useDiagramContext();

  return (
    <WebSocketProvider
      onDiagramUpdate={(update) => {
        setDiagram(update.diagram);
        if (update.title) {
          setTitle(update.title);
        }
      }}
      onStatusUpdate={setStatus}
    >
      {children}
    </WebSocketProvider>
  );
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <DiagramProvider>
        <WebSocketProviderWithDiagramContext>
          {children}
        </WebSocketProviderWithDiagramContext>
      </DiagramProvider>
    </ThemeProvider>
  );
}