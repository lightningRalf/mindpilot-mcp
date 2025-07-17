import { useState, useEffect } from 'react';
import { SearchBar, DiagramList } from './history';
import { ModeSelector, CloudModeModal } from '@/components/common';
import { useDiagramHistory, useExportDiagram, useAnalytics, useLocalStorage, useLocalStorageBoolean } from '@/hooks';
import { APP_VERSION } from '@/constants/app';

export interface HistoryPanelProps {
  onSelectDiagram: (diagramId: string) => void;
  isDarkMode: boolean;
  isExpanded?: boolean;
  currentDiagramId?: string | null;
  onCurrentDiagramTitleChange?: (newTitle: string) => void;
  refreshTrigger?: number;
  initialDiagramId?: string | null;
}

export function HistoryPanel({
  onSelectDiagram,
  isDarkMode,
  isExpanded = true,
  currentDiagramId,
  onCurrentDiagramTitleChange,
  refreshTrigger,
  initialDiagramId
}: HistoryPanelProps) {
  const [organizeByDate, setOrganizeByDate] = useLocalStorageBoolean('mindpilot-mcp-organize-by-date', true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useLocalStorage<'local' | 'cloud'>('mindpilot-mcp-mode', 'local');
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [shouldScrollToSelected, setShouldScrollToSelected] = useState(false);

  // Use the history hook
  const {
    totalDiagrams,
    loading,
    expandedCollections,
    groupedHistory,
    formatDate,
    toggleCollection,
    deleteDiagram,
    renameDiagram,
  } = useDiagramHistory({ 
    isExpanded, 
    searchQuery, 
    organizeByDate, 
    currentDiagramId, 
    onCurrentDiagramTitleChange,
    refreshTrigger
  });

  // Use the export hook
  const { exportAsPng } = useExportDiagram({ isDarkMode });
  
  // Use analytics
  const { trackDiagramSelected, trackDiagramExported, trackDiagramDeleted } = useAnalytics();

  // Handle initial diagram selection from URL
  useEffect(() => {
    if (initialDiagramId && !loading && groupedHistory.length > 0) {
      // Check if the diagram exists in history
      const diagramExists = groupedHistory.some(([_, diagrams]) => 
        diagrams.some(d => d.id === initialDiagramId)
      );
      
      if (diagramExists) {
        console.log('[HistoryPanel] Auto-selecting diagram from URL:', initialDiagramId);
        // Always trigger selection for URL diagrams, even if already selected
        // This ensures the diagram content is loaded
        onSelectDiagram(initialDiagramId);
        // Enable scrolling for URL-loaded diagrams
        setShouldScrollToSelected(true);
        // Disable scrolling after a short delay
        setTimeout(() => setShouldScrollToSelected(false), 1000);
      }
    }
  }, [initialDiagramId, loading, groupedHistory]); // Remove currentDiagramId and onSelectDiagram from deps

  const handleModeChange = (mode: 'local' | 'cloud') => {
    if (mode === 'cloud') {
      setShowCloudModal(true);
      // Don't actually change the mode to cloud
    } else {
      setCurrentMode(mode);
    }
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-neutral-800'}`}>
      {/* Header */}
      <div className={`font-medium relative px-4 py-6 border-b ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-50 border-neutral-200 text-neutral-800'} flex items-center justify-center`}>
        <ModeSelector 
          isDarkMode={isDarkMode}
          currentMode={currentMode}
          onModeChange={handleModeChange}
        />
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
          shouldScrollToSelected={shouldScrollToSelected}
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
          onRenameDiagram={renameDiagram}
          setOpenDropdownId={setOpenDropdownId}
          onClearSearch={() => setSearchQuery('')}
        />
      </div>

      {/* Status Bar */}
      <div
        className={`p-2 text-xs border-t flex items-center justify-between ${isDarkMode ? "text-neutral-400 border-neutral-700" : "text-muted-foreground border-neutral-300"}`}
      >
        <span>Mindpilot MCP v{APP_VERSION}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('showHotkeyModal'))}
            className={`hover:underline ${isDarkMode ? "text-neutral-400 hover:text-neutral-300" : "text-muted-foreground hover:text-neutral-600"}`}
          >
            Shortcuts
          </button>
          <a
            href="https://github.com/abrinsmead/mindpilot-mcp/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={`hover:underline ${isDarkMode ? "text-neutral-400 hover:text-neutral-300" : "text-muted-foreground hover:text-neutral-600"}`}
          >
            Feedback
          </a>
        </div>
      </div>

      {/* Cloud Mode Modal */}
      <CloudModeModal 
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
