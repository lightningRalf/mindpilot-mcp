import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, Calendar, MoreVertical, Download, Trash2, Search, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import mermaid from 'mermaid';
import { MCPServerStatus } from './MCPServerStatus';
import { EmptyState } from './common';

interface DiagramHistoryEntry {
  id: string;
  timestamp: string;
  lastEdited: string;
  diagram: string;
  title: string;
  collection: string | null;
}

interface HistoryPanelProps {
  onSelectDiagram: (diagram: string, title: string) => void;
  isDarkMode: boolean;
  isExpanded?: boolean;
  currentDiagram?: string;
  connectionStatus: string;
  onReconnect: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onSelectDiagram, isDarkMode, isExpanded = true, currentDiagram, connectionStatus, onReconnect }) => {
  const [history, setHistory] = useState<DiagramHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set(['uncategorized']));
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [organizeByDate, setOrganizeByDate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isExpanded) {
      fetchHistory();
    }
  }, [isExpanded]);

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

  const formatDate = (dateString: string) => {
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
  };

  const toggleCollection = (collection: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collection)) {
      newExpanded.delete(collection);
    } else {
      newExpanded.add(collection);
    }
    setExpandedCollections(newExpanded);
  };

  const handleDownload = async (entry: DiagramHistoryEntry) => {
    try {
      // Initialize mermaid with appropriate theme
      mermaid.initialize({
        startOnLoad: false,
        theme: isDarkMode ? 'dark' : 'default',
        securityLevel: 'loose',
        suppressErrorRendering: true,
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
        },
      });

      // Generate unique ID for rendering
      const id = `mermaid-export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Render the diagram
      const { svg } = await mermaid.render(id, entry.diagram);

      // Create a temporary div to parse the SVG
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svg;
      const svgElement = tempDiv.querySelector('svg');

      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${entry.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.svg`;
        a.click();

        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to render diagram for export:', error);
      alert('Failed to export diagram');
    }
  };

  const handleDelete = async (entry: DiagramHistoryEntry) => {
    if (!confirm(`Delete "${entry.title}"?`)) return;

    try {
      const response = await fetch(`/api/history/${entry.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the history
        fetchHistory();
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

  // Filter history based on search query
  const filteredHistory = React.useMemo(() => {
    if (!searchQuery.trim()) return history;

    const query = searchQuery.toLowerCase();
    return history.filter(entry =>
      entry.title.toLowerCase().includes(query) ||
      entry.diagram.toLowerCase().includes(query)
    );
  }, [history, searchQuery]);

  // Group diagrams by date
  const dateGroupedHistory = React.useMemo(() => {
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
  const groupedHistory = React.useMemo(() => {
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

  // Auto-expand collections that have search results
  useEffect(() => {
    if (searchQuery.trim()) {
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

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
      {/* Header */}

      <div className={`font-medium relative px-4 py-6 border-b ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'} flex items-center justify-center`}>
        {/* <Branding /> */}
        Mindpilot MCP
      </div>

      {/* Thin Banner */}
      <div className={`px-4 py-2 border-b text-xs flex items-center justify-between ${isDarkMode ? 'bg-gray-700/50 text-gray-400 border-gray-700' : 'bg-neutral-200 text-gray-900 border-neutral-300'}`}>
        <span>Saved Diagrams</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOrganizeByDate(false)}
            className={`px-2 py-0.5 rounded transition-colors ${
              !organizeByDate
                ? isDarkMode
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-500 text-white'
                : isDarkMode
                  ? 'hover:bg-orange-600/20 text-gray-400'
                  : 'hover:bg-orange-100 text-gray-600'
            }`}
          >
            By Project
          </button>
          <button
            onClick={() => setOrganizeByDate(true)}
            className={`px-2 py-0.5 rounded transition-colors ${
              organizeByDate
                ? isDarkMode
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-500 text-white'
                : isDarkMode
                  ? 'hover:bg-orange-600/20 text-gray-400'
                  : 'hover:bg-orange-100 text-gray-600'
            }`}
          >
            By Date
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={`border-b px-4 py-2 ${isDarkMode ? 'bg-gray-700/30 border-gray-700' : 'bg-neutral-100 border-gray-200'}`}>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search diagrams..."
            className={`w-full pl-8 pr-8 py-1.5 text-sm rounded ${
              isDarkMode
                ? 'bg-gray-800 text-gray-100 border-gray-600'
                : 'bg-white text-gray-900 border-gray-300'
            } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
        ) : history.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No diagrams yet</div>
        ) : filteredHistory.length === 0 && searchQuery ? (
          <EmptyState
            icon={Search}
            title="No diagrams found"
            description={`No diagrams match "${searchQuery}"`}
            action={{
              label: "Clear search",
              onClick: () => setSearchQuery('')
            }}
            size="sm"
            className="mt-8"
          />
        ) : (
          <div className="px-2 py-2 space-y-2">
            {(organizeByDate ? dateGroupedHistory : groupedHistory).map(([collection, diagrams]) => (
              <div key={collection} className="space-y-1">
                {/* Collection Header */}
                <button
                  onClick={() => toggleCollection(collection)}
                  className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                    isDarkMode
                      ? 'hover:bg-orange-600/20 text-gray-300'
                      : 'hover:bg-orange-50 text-gray-700'
                  }`}
                >
                  {expandedCollections.has(collection) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {organizeByDate ? (
                    <Calendar className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{collection}</span>
                </button>

                {/* Collection Diagrams */}
                {expandedCollections.has(collection) && (
                  <div className="pl-6 space-y-1">
                    {diagrams.map((entry) => {
                      const isActive = currentDiagram === entry.diagram;
                      return (
                        <button
                          key={entry.id}
                          onClick={() => onSelectDiagram(entry.diagram, entry.title)}
                          className={`w-full text-left p-2 rounded transition-colors border-l-2 group ${
                            isActive
                              ? isDarkMode
                                ? 'bg-orange-600/30 border-orange-500'
                                : 'bg-orange-100 border-orange-500'
                              : isDarkMode
                                ? 'hover:bg-orange-600/20 active:bg-orange-600/30 border-transparent'
                                : 'hover:bg-orange-50 active:bg-orange-100 border-transparent'
                          }`}
                        >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm truncate font-medium ${
                              isDarkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                              {entry.title}
                            </h3>
                            <span className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {formatDate(entry.timestamp)}
                            </span>
                          </div>
                          <DropdownMenu open={openDropdownId === entry.id} onOpenChange={(open: boolean) => setOpenDropdownId(open ? entry.id : null)}>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === entry.id ? null : entry.id);
                                }}
                                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600 ${
                                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                              <DropdownMenuItem
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleDownload(entry);
                                }}
                                className={isDarkMode ? 'text-gray-200 hover:bg-gray-600' : ''}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleDelete(entry);
                                }}
                                className={`${
                                  isDarkMode
                                    ? 'text-red-400 hover:bg-gray-600 hover:text-red-300'
                                    : 'text-red-600 hover:text-red-700'
                                }`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div
        className={`p-2 text-xs border-t flex items-center justify-between ${isDarkMode ? "text-gray-400 border-gray-700" : "text-muted-foreground border-gray-300"}`}
      >
        <MCPServerStatus
          connectionStatus={connectionStatus}
          onReconnect={onReconnect}
          isDarkMode={isDarkMode}
          isCollapsedView={false}
        />
      </div>
    </div>
  );
};
