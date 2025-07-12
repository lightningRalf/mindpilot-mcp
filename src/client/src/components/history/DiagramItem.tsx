import { MoreVertical, Download, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface DiagramHistoryEntry {
  id: string;
  timestamp: string;
  lastEdited: string;
  diagram: string;
  title: string;
  collection: string | null;
}

export interface DiagramItemProps {
  entry: DiagramHistoryEntry;
  isActive: boolean;
  isDarkMode: boolean;
  formatDate: (dateString: string) => string;
  onSelect: (diagram: string, title: string) => void;
  onDownload: (entry: DiagramHistoryEntry) => void;
  onDelete: (entry: DiagramHistoryEntry) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}

export function DiagramItem({
  entry,
  isActive,
  isDarkMode,
  formatDate,
  onSelect,
  onDownload,
  onDelete,
  openDropdownId,
  setOpenDropdownId,
}: DiagramItemProps) {
  return (
    <button
      key={entry.id}
      onClick={() => onSelect(entry.diagram, entry.title)}
      className={`w-full text-left p-2 rounded transition-colors border-l-2 group ${
        isActive
          ? isDarkMode
            ? 'bg-orange-500/20 border-orange-500'
            : 'bg-orange-100 border-orange-500'
          : isDarkMode
            ? 'hover:bg-orange-500/10 active:bg-orange-500/20 border-transparent'
            : 'hover:bg-orange-50 active:bg-orange-100 border-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium truncate ${
            isActive
              ? isDarkMode ? 'text-orange-300' : 'text-orange-700'
              : isDarkMode ? 'text-gray-200' : 'text-gray-900'
          }`}>
            {entry.title}
          </h4>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatDate(entry.lastEdited)}
          </p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu open={openDropdownId === entry.id} onOpenChange={(open) => setOpenDropdownId(open ? entry.id : null)}>
            <DropdownMenuTrigger
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(entry);
                  setOpenDropdownId(null);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download as PNG
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry);
                  setOpenDropdownId(null);
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </button>
  );
}