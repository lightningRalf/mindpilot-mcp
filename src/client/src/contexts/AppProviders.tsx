import React, { ReactNode } from 'react';
import { DiagramProvider, useDiagramContext } from './DiagramContext';
import { WebSocketProvider } from './WebSocketContext';
import { ThemeProvider } from './ThemeContext';
import { useAnalytics } from '@/hooks';

interface AppProvidersProps {
  children: ReactNode;
}

// Inner component that has access to DiagramContext
function WebSocketProviderWithDiagramContext({ children }: { children: ReactNode }) {
  const { updateDiagram, setStatus } = useDiagramContext();
  const { trackDiagramCreated } = useAnalytics();

  return (
    <WebSocketProvider
      onDiagramUpdate={(update) => {
        updateDiagram(update.diagram, update.title);
        // Note: MCP doesn't send collection info, so it remains unchanged
        // Track diagram created from MCP
        trackDiagramCreated({ source: 'mcp' });
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