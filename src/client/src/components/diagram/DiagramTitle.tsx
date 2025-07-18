import { InlineEdit } from '@/components/ui/InlineEdit';

interface DiagramTitleProps {
  title: string | null;
  collection: string | null;
  isDarkMode: boolean;
  onTitleChange?: (newTitle: string) => void;
  isEditable?: boolean;
}

export function DiagramTitle({ title, collection, isDarkMode, onTitleChange, isEditable = false }: DiagramTitleProps) {
  if (!title) return null;

  return (
    <div className="absolute top-4 left-0 right-0 flex justify-center items-center pointer-events-none z-40">
      <div className={`px-4 py-2 mt-0 rounded-lg backdrop-blur-md pointer-events-auto ${isDarkMode ? "bg-neutral-900/50" : "bg-neutral-300/25"}`}>
        {collection && (
          <div className={`text-xs text-center mb-0.5 ${isDarkMode ? "text-neutral-400" : "text-neutral-500"}`}>
            {collection}
          </div>
        )}
        {isEditable && onTitleChange ? (
          <InlineEdit
            value={title}
            onSave={onTitleChange}
            className={`text-lg text-center ${isDarkMode ? "text-neutral-200" : "text-neutral-600"}`}
            editClassName={`px-2 py-1 rounded ${isDarkMode ? "bg-neutral-800/80 ring-2 ring-orange-500/50" : "bg-white/80 ring-2 ring-orange-400/50"}`}
            placeholder="Untitled Diagram"
          />
        ) : (
          <h1 className={`text-lg text-center ${isDarkMode ? "text-neutral-200" : "text-neutral-600"}`}>
            {title}
          </h1>
        )}
      </div>
    </div>
  );
}
