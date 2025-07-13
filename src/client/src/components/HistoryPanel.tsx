import React, { useState } from 'react';
import { SearchBar, DiagramList } from './history';
import { MCPServerStatus } from './connection';
import { useDiagramHistory, useExportDiagram, useAnalytics } from '@/hooks';

export interface HistoryPanelProps {
  onSelectDiagram: (diagramId: string) => void;
  isDarkMode: boolean;
  isExpanded?: boolean;
  currentDiagramId?: string | null;
  connectionStatus: string;
  onReconnect: () => void;
}

export function HistoryPanel({
  onSelectDiagram,
  isDarkMode,
  isExpanded = true,
  currentDiagramId,
  connectionStatus,
  onReconnect
}: HistoryPanelProps) {
  const [organizeByDate, setOrganizeByDate] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Use the history hook
  const {
    history,
    totalDiagrams,
    loading,
    expandedCollections,
    groupedHistory,
    formatDate,
    toggleCollection,
    deleteDiagram,
  } = useDiagramHistory({ isExpanded, searchQuery, organizeByDate });

  // Use the export hook
  const { exportAsPng } = useExportDiagram({ isDarkMode });
  
  // Use analytics
  const { trackDiagramSelected, trackDiagramExported, trackDiagramDeleted } = useAnalytics();

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-neutral-800'}`}>
      {/* Header */}
      <div className={`font-medium relative px-4 py-6 border-b ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-50 border-neutral-200 text-neutral-800'} flex items-center justify-center`}>
        <span>Mindpilot MCP</span>
      </div>

      {/* Thin Banner with Saved Diagrams and Toggle */}
      <div className={`px-4 py-2 border-b text-xs flex items-center justify-between ${isDarkMode ? 'bg-neutral-700/50 text-neutral-400 border-neutral-700' : 'bg-neutral-200 text-neutral-900 border-neutral-300'}`}>
        <span>Saved Diagrams</span>
        <div className="flex items-center gap-0.5 bg-neutral-300 dark:bg-neutral-600 p-0.5 rounded">
          <button
            onClick={() => setOrganizeByDate(false)}
            className={`px-2 py-0.5 rounded transition-colors ${
              !organizeByDate
                ? isDarkMode
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-500 text-white'
                : isDarkMode
                  ? 'hover:bg-orange-600/20 text-neutral-400'
                  : 'hover:bg-orange-100 text-neutral-600'
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
                  ? 'hover:bg-orange-600/20 text-neutral-400'
                  : 'hover:bg-orange-100 text-neutral-600'
            }`}
          >
            By Date
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        isDarkMode={isDarkMode}
      />

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        <DiagramList
          groupedData={groupedHistory}
          organizeByDate={organizeByDate}
          isDarkMode={isDarkMode}
          currentDiagramId={currentDiagramId}
          searchQuery={searchQuery}
          loading={loading}
          totalDiagrams={totalDiagrams}
          expandedCollections={expandedCollections}
          openDropdownId={openDropdownId}
          formatDate={formatDate}
          onToggleCollection={toggleCollection}
          onSelectDiagram={(entry) => {
            onSelectDiagram(entry.id);
            trackDiagramSelected({ 
              source: 'history', 
              organizedBy: organizeByDate ? 'date' : 'project' 
            });
          }}
          onDownloadDiagram={(entry) => {
            exportAsPng(entry.diagram, entry.title);
            trackDiagramExported({ format: 'png' });
          }}
          onDeleteDiagram={(entry) => {
            deleteDiagram(entry);
            trackDiagramDeleted();
          }}
          setOpenDropdownId={setOpenDropdownId}
          onClearSearch={() => setSearchQuery('')}
        />
      </div>

      {/* Status Bar */}
      <div
        className={`p-2 text-xs border-t flex items-center justify-between ${isDarkMode ? "text-neutral-400 border-neutral-700" : "text-muted-foreground border-neutral-300"}`}
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
}
