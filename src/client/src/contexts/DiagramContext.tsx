import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocalStorageString } from '@/hooks/useLocalStorage';

export interface DiagramContextValue {
  // State
  diagram: string;
  title: string;
  collection: string | null;
  currentDiagramId: string | null;
  status: string;
  isLoadingDiagram: boolean;
  
  // Actions
  setDiagram: (diagram: string) => void;
  setTitle: (title: string) => void;
  setCollection: (collection: string | null) => void;
  setCurrentDiagramId: (id: string | null) => void;
  setStatus: (status: string) => void;
  setIsLoadingDiagram: (loading: boolean) => void;
  updateDiagram: (diagram: string, title?: string, collection?: string | null) => void;
  loadDiagramById: (id: string) => Promise<void>;
}

const DiagramContext = createContext<DiagramContextValue | undefined>(undefined);

export interface DiagramProviderProps {
  children: ReactNode;
}

export function DiagramProvider({ children }: DiagramProviderProps) {
  // Store just the diagram ID in localStorage
  const [currentDiagramId, setCurrentDiagramId] = useLocalStorageString('mindpilot-mcp-current-diagram-id', null);
  
  console.log('[DiagramContext] Initial currentDiagramId from localStorage:', currentDiagramId);
  console.log('[DiagramContext] Raw localStorage value:', localStorage.getItem('mindpilot-mcp-current-diagram-id'));
  
  // These are still in memory but not persisted individually
  const [diagram, setDiagram] = useState('');
  const [title, setTitle] = useState('');
  const [collection, setCollection] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready');
  const [isLoadingDiagram, setIsLoadingDiagram] = useState(false);
  
  // Load diagram by ID from history
  const loadDiagramById = useCallback(async (id: string) => {
    try {
      setIsLoadingDiagram(true);
      
      // Fetch history from API
      const response = await fetch('/api/history');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const history = await response.json();
      const entry = history.find((h: any) => h.id === id);
      
      if (entry) {
        setDiagram(entry.diagram);
        setTitle(entry.title);
        setCollection(entry.collection);
        setCurrentDiagramId(id);
        setStatus('Loaded from history');
        console.log('[DiagramContext] Loaded diagram from history:', { id, title: entry.title, collection: entry.collection });
      } else {
        setStatus('Diagram not found');
      }
    } catch (error) {
      console.error('Failed to load diagram by ID:', error);
      setStatus('Failed to load diagram');
    } finally {
      setIsLoadingDiagram(false);
    }
  }, [setCurrentDiagramId]);

  // Track if we've loaded the initial diagram
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  // Load initial diagram if ID exists
  useEffect(() => {
    if (currentDiagramId && !hasLoadedInitial) {
      console.log('[DiagramContext] Loading diagram from localStorage ID:', currentDiagramId);
      loadDiagramById(currentDiagramId);
      setHasLoadedInitial(true);
    }
  }, [currentDiagramId, hasLoadedInitial, loadDiagramById]); // React to ID changes

  // Convenience method to update diagram, title, and collection
  const updateDiagram = useCallback((newDiagram: string, newTitle?: string, newCollection?: string | null) => {
    // Only update and clear ID if the diagram actually changed
    if (newDiagram !== diagram) {
      setDiagram(newDiagram);
      // Clear the ID when updating from MCP since it's not from history
      console.log('[DiagramContext] Clearing currentDiagramId because diagram changed from MCP');
      setCurrentDiagramId(null);
    }
    if (newTitle !== undefined) {
      setTitle(newTitle);
    }
    if (newCollection !== undefined) {
      setCollection(newCollection);
    }
  }, [diagram, setCurrentDiagramId]);
  
  const value: DiagramContextValue = {
    diagram,
    title,
    collection,
    currentDiagramId,
    status,
    isLoadingDiagram,
    setDiagram,
    setTitle,
    setCollection,
    setCurrentDiagramId,
    setStatus,
    setIsLoadingDiagram,
    updateDiagram,
    loadDiagramById,
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