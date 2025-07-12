import React, { useState } from 'react';
import { MCPServerStatus } from './MCPServerStatus';
import { SearchBar, DiagramList } from './history';
import { useDiagramHistory, useExportDiagram } from '@/hooks';

export interface HistoryPanelProps {
  onSelectDiagram: (diagram: string, title: string) => void;
  isDarkMode: boolean;
  isExpanded?: boolean;
  currentDiagram?: string;
  connectionStatus: string;
  onReconnect: () => void;
}

export function HistoryPanel({ 
  onSelectDiagram, 
  isDarkMode, 
  isExpanded = true, 
  currentDiagram, 
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

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
      {/* Header */}
      <div className={`font-medium relative px-4 py-6 border-b ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'} flex items-center justify-center`}>
        <span>Mindpilot MCP</span>
      </div>

      {/* Thin Banner with Saved Diagrams and Toggle */}
      <div className={`px-4 py-2 border-b text-xs flex items-center justify-between ${isDarkMode ? 'bg-gray-700/50 text-gray-400 border-gray-700' : 'bg-neutral-200 text-gray-900 border-neutral-300'}`}>
        <span>Saved Diagrams</span>
        <div className="flex items-center gap-0.5 bg-gray-200 dark:bg-gray-600 p-0.5 rounded">
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
          currentDiagram={currentDiagram}
          searchQuery={searchQuery}
          loading={loading}
          totalDiagrams={totalDiagrams}
          expandedCollections={expandedCollections}
          openDropdownId={openDropdownId}
          formatDate={formatDate}
          onToggleCollection={toggleCollection}
          onSelectDiagram={onSelectDiagram}
          onDownloadDiagram={(entry) => exportAsPng(entry.diagram, entry.title)}
          onDeleteDiagram={deleteDiagram}
          setOpenDropdownId={setOpenDropdownId}
          onClearSearch={() => setSearchQuery('')}
        />
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
}