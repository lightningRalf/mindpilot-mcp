import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, MoreVertical, Download, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import mermaid from 'mermaid';
import { MCPServerStatus } from './MCPServerStatus';
import { Branding } from './Branding';

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

  // Group diagrams by collection and sort collections by most recent diagram
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, DiagramHistoryEntry[]> = {};

    // Group diagrams by collection
    history.forEach(entry => {
      const collectionName = entry.collection || 'uncategorized';
      if (!groups[collectionName]) {
        groups[collectionName] = [];
      }
      groups[collectionName].push(entry);
    });

    // Sort diagrams within each collection by timestamp (newest first)
    Object.keys(groups).forEach(collection => {
      groups[collection].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });

    // Sort collections by the most recent diagram timestamp
    const sortedCollections = Object.entries(groups).sort(([, diagramsA], [, diagramsB]) => {
      const latestA = new Date(diagramsA[0].timestamp).getTime();
      const latestB = new Date(diagramsB[0].timestamp).getTime();
      return latestB - latestA;
    });

    return sortedCollections;
  }, [history]);

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`relative px-4 py-3 pt-16 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
        {/* <h2 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          History
        </h2> */}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
        ) : history.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No diagrams yet</div>
        ) : (
          <div className="pl-2 py-2 pr-0 space-y-2">
            {groupedHistory.map(([collection, diagrams]) => (
              <div key={collection} className="space-y-1 pr-6">
                {/* Collection Header */}
                <button
                  onClick={() => toggleCollection(collection)}
                  className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                    isDarkMode
                      ? 'hover:bg-sky-700 text-gray-300'
                      : 'hover:bg-indigo-50 text-gray-700'
                  }`}
                >
                  {expandedCollections.has(collection) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Folder className="h-4 w-4" />
                  <span className="text-sm font-medium">{collection}</span>
                </button>

                {/* Collection Diagrams */}
                {expandedCollections.has(collection) && (
                  <div className="pl-4 pr-2 space-y-1">
                    {diagrams.map((entry) => {
                      const isActive = currentDiagram === entry.diagram;
                      return (
                        <button
                          key={entry.id}
                          onClick={() => onSelectDiagram(entry.diagram, entry.title)}
                          className={`w-full text-left p-2 rounded transition-colors border-l-2 group ${
                            isActive
                              ? isDarkMode
                                ? 'bg-gray-700 border-blue-500'
                                : 'bg-gray-200 border-blue-500'
                              : isDarkMode
                                ? 'hover:bg-sky-700 active:bg-sky-600 border-transparent'
                                : 'hover:bg-indigo-50 active:bg-indigo-100 border-transparent'
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
        <Branding />
      </div>
    </div>
  );
};
