import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HotkeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

interface Shortcut {
  keys: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Theme
  { keys: "D", description: "Toggle dark/light mode", category: "Theme" },

  // Panels
  { keys: "H", description: "Toggle history panel", category: "Panels" },
  { keys: "E", description: "Toggle editor panel", category: "Panels" },

  // Navigation
  { keys: "← →", description: "Navigate between diagrams", category: "Navigation" },

  // View
  { keys: "↑ ↓", description: "Zoom in / out", category: "View" },
  { keys: "F", description: "Fit to screen", category: "View" },

  // Help
  { keys: "?", description: "Show keyboard shortcuts", category: "Help" },
];

export function HotkeyModal({ isOpen, onClose, isDarkMode }: HotkeyModalProps) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${isDarkMode ? 'bg-neutral-800 text-neutral-100' : 'bg-white'} [&>button]:!ring-0 [&>button]:!ring-offset-0 [&>button]:!outline-none`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Keyboard Shortcuts</DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}>
            Quick reference for all available keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className={`text-sm font-semibold mb-3 ${
                isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}>
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                      isDarkMode ? 'bg-neutral-700' : 'bg-neutral-50'
                    }`}
                  >
                    <span className={`text-sm ${
                      isDarkMode ? 'text-neutral-200' : 'text-neutral-700'
                    }`}>
                      {shortcut.description}
                    </span>
                    <kbd className={`px-2 py-1 text-xs font-mono rounded ${
                      isDarkMode
                        ? 'bg-neutral-600 text-neutral-200 border border-neutral-500'
                        : 'bg-neutral-200 text-neutral-700 border border-neutral-300'
                    }`}>
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-6 pt-4 border-t text-xs text-center ${
          isDarkMode ? 'border-neutral-700 text-neutral-500' : 'border-neutral-200 text-neutral-400'
        }`}>
          Press <kbd className={`px-1.5 py-0.5 mx-1 font-mono rounded ${
            isDarkMode
              ? 'bg-neutral-700 text-neutral-300 border border-neutral-600'
              : 'bg-neutral-200 text-neutral-600 border border-neutral-300'
          }`}>?</kbd> or <kbd className={`px-1.5 py-0.5 mx-1 font-mono rounded ${
            isDarkMode
              ? 'bg-neutral-700 text-neutral-300 border border-neutral-600'
              : 'bg-neutral-200 text-neutral-600 border border-neutral-300'
          }`}>Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
