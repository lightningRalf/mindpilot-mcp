import { MoreVertical, Download, Trash2, Edit, FileText, FileImage } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { InlineEdit, InlineEditRef } from '@/components/ui/InlineEdit';
import { useRef, useEffect } from 'react';

export interface DiagramHistoryEntry {
  id: string;
  type: string;
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
  onSelect: (entry: DiagramHistoryEntry) => void;
  onExport: (entry: DiagramHistoryEntry, format: 'png' | 'svg' | 'mermaid') => void;
  onDelete: (entry: DiagramHistoryEntry) => void;
  onRename: (entry: DiagramHistoryEntry, newTitle: string) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  shouldScrollIntoView?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

export function DiagramItem({
  entry,
  isActive,
  isDarkMode,
  formatDate,
  onSelect,
  onExport,
  onDelete,
  onRename,
  openDropdownId,
  setOpenDropdownId,
  shouldScrollIntoView = false,
  onEditingChange,
}: DiagramItemProps) {
  const inlineEditRef = useRef<InlineEditRef>(null);
  const itemRef = useRef<HTMLButtonElement>(null);

  // Scroll into view when active and shouldScrollIntoView is true
  useEffect(() => {
    if (isActive && shouldScrollIntoView && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      });
    }
  }, [isActive, shouldScrollIntoView]);

  const handleRename = () => {
    inlineEditRef.current?.startEditing();
    setOpenDropdownId(null);
  };

  return (
    <button
      ref={itemRef}
      key={entry.id}
      onClick={() => onSelect(entry)}
      className={`w-full text-left p-2 rounded transition-colors border-l-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
        isActive
          ? isDarkMode
            ? 'bg-orange-500/20 border-orange-500'
            : 'bg-orange-100 border-orange-500'
          : isDarkMode
            ? 'hover:bg-orange-500/5 active:bg-orange-500/10 border-transparent'
            : 'hover:bg-orange-50 active:bg-orange-100 border-transparent'
      } ${isDarkMode ? 'focus-visible:ring-offset-neutral-800' : 'focus-visible:ring-offset-white'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <InlineEdit
            ref={inlineEditRef}
            value={entry.title}
            onSave={(newTitle) => onRename(entry, newTitle)}
            onEditingChange={onEditingChange}
            className={`text-sm font-medium text-left truncate ${
              isActive
                ? isDarkMode ? 'text-orange-300' : 'text-orange-700'
                : isDarkMode ? 'text-neutral-200' : 'text-neutral-900'
            }`}
            editClassName={`w-full px-1 rounded ${isDarkMode ? "bg-neutral-700 ring-1 ring-orange-500/50" : "bg-white ring-1 ring-orange-400/50"}`}
            placeholder="Untitled"
            requireDoubleClick={true}
          />
          <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
            {formatDate(entry.lastEdited)}
          </p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu open={openDropdownId === entry.id} onOpenChange={(open) => setOpenDropdownId(open ? entry.id : null)}>
            <DropdownMenuTrigger asChild>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={`p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer`}
              >
                <MoreVertical className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              className={isDarkMode 
                ? "bg-neutral-800 border-neutral-700 text-neutral-100" 
                : "bg-white border-neutral-200 text-neutral-900"
              }
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename();
                }}
                className={isDarkMode 
                  ? "hover:bg-neutral-700 focus:bg-neutral-700" 
                  : "hover:bg-neutral-100 focus:bg-neutral-100"
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className={isDarkMode 
                    ? "hover:bg-neutral-700 focus:bg-neutral-700" 
                    : "hover:bg-neutral-100 focus:bg-neutral-100"
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent 
                  className={isDarkMode 
                    ? "bg-neutral-800 border-neutral-700 text-neutral-100" 
                    : "bg-white border-neutral-200 text-neutral-900"
                  }
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(entry, 'png');
                      setOpenDropdownId(null);
                    }}
                    className={isDarkMode 
                      ? "hover:bg-neutral-700 focus:bg-neutral-700" 
                      : "hover:bg-neutral-100 focus:bg-neutral-100"
                    }
                  >
                    <FileImage className="mr-2 h-4 w-4" />
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(entry, 'svg');
                      setOpenDropdownId(null);
                    }}
                    className={isDarkMode 
                      ? "hover:bg-neutral-700 focus:bg-neutral-700" 
                      : "hover:bg-neutral-100 focus:bg-neutral-100"
                    }
                  >
                    <FileImage className="mr-2 h-4 w-4" />
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(entry, 'mermaid');
                      setOpenDropdownId(null);
                    }}
                    className={isDarkMode 
                      ? "hover:bg-neutral-700 focus:bg-neutral-700" 
                      : "hover:bg-neutral-100 focus:bg-neutral-100"
                    }
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export as Mermaid
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry);
                  setOpenDropdownId(null);
                }}
                className={isDarkMode 
                  ? "text-red-400 hover:bg-red-900/20 focus:bg-red-900/20 hover:text-red-300 focus:text-red-300" 
                  : "text-red-600 hover:bg-red-50 focus:bg-red-50 hover:text-red-700 focus:text-red-700"
                }
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
