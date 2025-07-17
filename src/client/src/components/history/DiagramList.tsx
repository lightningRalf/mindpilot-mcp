import { ChevronRight, ChevronDown, Folder, Calendar } from 'lucide-react';
import { DiagramItem, DiagramHistoryEntry } from './DiagramItem';
import { EmptyState } from '@/components/common';
import { Search } from 'lucide-react';

export interface DiagramListProps {
  groupedData: [string, DiagramHistoryEntry[]][];
  organizeByDate: boolean;
  isDarkMode: boolean;
  currentDiagramId?: string | null;
  searchQuery: string;
  loading: boolean;
  totalDiagrams: number;
  expandedCollections: Set<string>;
  openDropdownId: string | null;
  formatDate: (dateString: string) => string;
  onToggleCollection: (collection: string) => void;
  onSelectDiagram: (entry: DiagramHistoryEntry) => void;
  onDownloadDiagram: (entry: DiagramHistoryEntry) => void;
  onDeleteDiagram: (entry: DiagramHistoryEntry) => void;
  onRenameDiagram: (entry: DiagramHistoryEntry, newTitle: string) => void;
  setOpenDropdownId: (id: string | null) => void;
  onClearSearch: () => void;
  shouldScrollToSelected?: boolean;
}

export function DiagramList({
  groupedData,
  organizeByDate,
  isDarkMode,
  currentDiagramId,
  searchQuery,
  loading,
  totalDiagrams,
  expandedCollections,
  openDropdownId,
  formatDate,
  onToggleCollection,
  onSelectDiagram,
  onDownloadDiagram,
  onDeleteDiagram,
  onRenameDiagram,
  setOpenDropdownId,
  onClearSearch,
  shouldScrollToSelected = false,
}: DiagramListProps) {
  if (loading) {
    return <div className="p-4 text-center text-sm text-neutral-500">Loading...</div>;
  }

  if (totalDiagrams === 0) {
    return <div className="p-4 text-center text-sm text-neutral-500">No diagrams yet</div>;
  }

  if (groupedData.length === 0 && searchQuery) {
    return (
      <EmptyState
        icon={Search}
        title="No diagrams found"
        description={`No diagrams match "${searchQuery}"`}
        action={{
          label: "Clear search",
          onClick: onClearSearch
        }}
        size="sm"
        className="mt-8"
      />
    );
  }

  return (
    <div className="px-2 py-2 space-y-2">
      {groupedData.map(([collection, diagrams]) => (
        <div key={collection} className="space-y-1">
          {/* Collection Header */}
          <button
            onClick={() => onToggleCollection(collection)}
            className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors ${
              isDarkMode
                ? 'hover:bg-orange-600/20 text-neutral-300'
                : 'hover:bg-orange-50 text-neutral-700'
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
              {diagrams.map((entry) => (
                <DiagramItem
                  key={entry.id}
                  entry={entry}
                  isActive={currentDiagramId === entry.id}
                  isDarkMode={isDarkMode}
                  formatDate={formatDate}
                  onSelect={onSelectDiagram}
                  onDownload={onDownloadDiagram}
                  onDelete={onDeleteDiagram}
                  onRename={onRenameDiagram}
                  openDropdownId={openDropdownId}
                  setOpenDropdownId={setOpenDropdownId}
                  shouldScrollIntoView={shouldScrollToSelected && currentDiagramId === entry.id}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
