import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface DiagramContextValue {
  // State
  diagram: string;
  title: string;
  collection: string | null;
  status: string;
  isLoadingDiagram: boolean;
  
  // Actions
  setDiagram: (diagram: string) => void;
  setTitle: (title: string) => void;
  setCollection: (collection: string | null) => void;
  setStatus: (status: string) => void;
  setIsLoadingDiagram: (loading: boolean) => void;
  updateDiagram: (diagram: string, title?: string, collection?: string | null) => void;
}

const DiagramContext = createContext<DiagramContextValue | undefined>(undefined);

export interface DiagramProviderProps {
  children: ReactNode;
}

export function DiagramProvider({ children }: DiagramProviderProps) {
  // Use localStorage-backed state hooks
  const [diagram, setDiagram] = useLocalStorage('mindpilot-mcp-last-diagram', '');
  const [title, setTitle] = useLocalStorage('mindpilot-mcp-last-title', '');
  const [collection, setCollection] = useLocalStorage<string | null>('mindpilot-mcp-last-collection', null);
  
  const [status, setStatus] = useState('Ready');
  const [isLoadingDiagram, setIsLoadingDiagram] = useState(false);
  
  // Convenience method to update diagram, title, and collection
  const updateDiagram = useCallback((newDiagram: string, newTitle?: string, newCollection?: string | null) => {
    setDiagram(newDiagram);
    if (newTitle !== undefined) {
      setTitle(newTitle);
    }
    if (newCollection !== undefined) {
      setCollection(newCollection);
    }
  }, [setDiagram, setTitle, setCollection]);
  
  const value: DiagramContextValue = {
    diagram,
    title,
    collection,
    status,
    isLoadingDiagram,
    setDiagram,
    setTitle,
    setCollection,
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