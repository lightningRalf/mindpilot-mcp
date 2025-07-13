import { useState, useEffect, useCallback, useMemo } from 'react';

export interface DiagramHistoryEntry {
  id: string;
  timestamp: string;
  lastEdited: string;
  diagram: string;
  title: string;
  collection: string | null;
}

export interface UseDiagramHistoryOptions {
  isExpanded?: boolean;
  searchQuery: string;
  organizeByDate: boolean;
  currentDiagramId?: string | null;
  onCurrentDiagramTitleChange?: (newTitle: string) => void;
  refreshTrigger?: number;
}

export function useDiagramHistory({ isExpanded = true, searchQuery, organizeByDate, currentDiagramId, onCurrentDiagramTitleChange, refreshTrigger }: UseDiagramHistoryOptions) {
  const [history, setHistory] = useState<DiagramHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set(['Today']));

  // Fetch history when expanded or refresh trigger changes
  useEffect(() => {
    if (isExpanded) {
      fetchHistory();
    }
  }, [isExpanded, refreshTrigger]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete diagram
  const deleteDiagram = async (entry: DiagramHistoryEntry) => {
    if (!confirm(`Delete "${entry.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/history/${entry.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setHistory(prev => prev.filter(h => h.id !== entry.id));
      } else {
        const errorData = await response.text();
        console.error('Delete failed:', response.status, errorData);
        alert(`Failed to delete diagram: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to delete diagram:', error);
      alert('Failed to delete diagram');
    }
  };

  // Rename diagram
  const renameDiagram = async (entry: DiagramHistoryEntry, newTitle: string) => {
    if (!newTitle.trim() || newTitle === entry.title) {
      return;
    }

    try {
      const response = await fetch(`/api/history/${entry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      
      if (response.ok) {
        setHistory(prev => prev.map(h => 
          h.id === entry.id ? { ...h, title: newTitle.trim() } : h
        ));
        
        // If this is the currently active diagram, update the diagram context too
        if (currentDiagramId === entry.id && onCurrentDiagramTitleChange) {
          onCurrentDiagramTitleChange(newTitle.trim());
        }
      } else {
        const errorData = await response.text();
        console.error('Rename failed:', response.status, errorData);
        alert(`Failed to rename diagram: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to rename diagram:', error);
      alert('Failed to rename diagram');
    }
  };

  // Format date helper
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  // Toggle collection
  const toggleCollection = useCallback((collection: string) => {
    setExpandedCollections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(collection)) {
        newExpanded.delete(collection);
      } else {
        newExpanded.add(collection);
      }
      return newExpanded;
    });
  }, []);

  // Filter history based on search query
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;

    const query = searchQuery.toLowerCase();
    return history.filter(entry =>
      entry.title.toLowerCase().includes(query) ||
      entry.diagram.toLowerCase().includes(query)
    );
  }, [history, searchQuery]);

  // Group diagrams by date
  const dateGroupedHistory = useMemo(() => {
    const groups: Record<string, DiagramHistoryEntry[]> = {};

    filteredHistory.forEach(entry => {
      const date = new Date(entry.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      let groupName: string;
      if (date.toDateString() === today.toDateString()) {
        groupName = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupName = 'Yesterday';
      } else if (date > lastWeek) {
        groupName = 'This Week';
      } else {
        groupName = 'Older';
      }

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(entry);
    });

    // Sort diagrams within each group by timestamp (newest first)
    Object.keys(groups).forEach(group => {
      groups[group].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });

    // Return in a fixed order
    const orderedGroups: [string, DiagramHistoryEntry[]][] = [];
    const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];
    groupOrder.forEach(groupName => {
      if (groups[groupName]) {
        orderedGroups.push([groupName, groups[groupName]]);
      }
    });

    return orderedGroups;
  }, [filteredHistory]);

  // Group diagrams by collection and sort collections by most recent diagram
  const collectionGroupedHistory = useMemo(() => {
    const groups: Record<string, DiagramHistoryEntry[]> = {};

    // Group diagrams by collection
    filteredHistory.forEach(entry => {
      const collectionName = entry.collection || 'uncategorized';
      if (!groups[collectionName]) {
        groups[collectionName] = [];
      }
      groups[collectionName].push(entry);
    });

    // Sort diagrams within each collection alphabetically by title
    Object.keys(groups).forEach(collection => {
      groups[collection].sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    });

    // Sort collections alphabetically
    const sortedCollections = Object.entries(groups).sort(([collectionA], [collectionB]) => {
      return collectionA.localeCompare(collectionB);
    });

    return sortedCollections;
  }, [filteredHistory]);

  // Expand all collections when searching
  useEffect(() => {
    if (searchQuery) {
      const collectionsWithResults = new Set<string>();

      // Find all collections that have matching diagrams
      filteredHistory.forEach(entry => {
        const collectionName = entry.collection || 'uncategorized';
        collectionsWithResults.add(collectionName);
      });

      // Also add date groups if in date mode
      if (organizeByDate) {
        dateGroupedHistory.forEach(([groupName]) => {
          collectionsWithResults.add(groupName);
        });
      }

      setExpandedCollections(collectionsWithResults);
    }
  }, [searchQuery, filteredHistory, organizeByDate, dateGroupedHistory]);

  // Auto-expand the first non-empty group when in date mode
  useEffect(() => {
    if (organizeByDate && dateGroupedHistory.length > 0 && expandedCollections.size === 0) {
      // Find the first group with entries
      const firstNonEmptyGroup = dateGroupedHistory.find(([_, entries]) => entries.length > 0);
      if (firstNonEmptyGroup) {
        setExpandedCollections(new Set([firstNonEmptyGroup[0]]));
      }
    }
  }, [organizeByDate, dateGroupedHistory]);

  return {
    history: filteredHistory,
    totalDiagrams: history.length,
    loading,
    expandedCollections,
    groupedHistory: organizeByDate ? dateGroupedHistory : collectionGroupedHistory,
    formatDate,
    toggleCollection,
    deleteDiagram,
    renameDiagram,
    refetchHistory: fetchHistory,
  };
}