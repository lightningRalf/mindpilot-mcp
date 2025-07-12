import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface DiagramContextValue {
  // State
  diagram: string;
  title: string;
  status: string;
  isLoadingDiagram: boolean;
  
  // Actions
  setDiagram: (diagram: string) => void;
  setTitle: (title: string) => void;
  setStatus: (status: string) => void;
  setIsLoadingDiagram: (loading: boolean) => void;
  updateDiagram: (diagram: string, title?: string) => void;
}

const DiagramContext = createContext<DiagramContextValue | undefined>(undefined);

export interface DiagramProviderProps {
  children: ReactNode;
}

export function DiagramProvider({ children }: DiagramProviderProps) {
  // Use localStorage-backed state hooks
  const [diagram, setDiagram] = useLocalStorage('mindpilot-mcp-last-diagram', '');
  const [title, setTitle] = useLocalStorage('mindpilot-mcp-last-title', '');
  
  const [status, setStatus] = useState('Ready');
  const [isLoadingDiagram, setIsLoadingDiagram] = useState(false);
  
  // Convenience method to update both diagram and title
  const updateDiagram = useCallback((newDiagram: string, newTitle?: string) => {
    setDiagram(newDiagram);
    if (newTitle !== undefined) {
      setTitle(newTitle);
    }
  }, [setDiagram, setTitle]);
  
  const value: DiagramContextValue = {
    diagram,
    title,
    status,
    isLoadingDiagram,
    setDiagram,
    setTitle,
    setStatus,
    setIsLoadingDiagram,
    updateDiagram,
  };
  
  return (
    <DiagramContext.Provider value={value}>
      {children}
    </DiagramContext.Provider>
  );
}

export function useDiagramContext() {
  const context = useContext(DiagramContext);
  if (context === undefined) {
    throw new Error('useDiagramContext must be used within a DiagramProvider');
  }
  return context;
}