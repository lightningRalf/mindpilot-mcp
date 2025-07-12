import React from 'react';
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
  // Panel shortcuts
  { keys: "⌘B", description: "Toggle history panel", category: "Panels" },
  { keys: "⌘E", description: "Toggle editor panel", category: "Panels" },
  
  // Zoom shortcuts
  { keys: "⌘+", description: "Zoom in", category: "View" },
  { keys: "⌘-", description: "Zoom out", category: "View" },
  { keys: "⌘0", description: "Reset zoom", category: "View" },
  
  // Help
  { keys: "?", description: "Show keyboard shortcuts", category: "Help" },
];

export const HotkeyModal: React.FC<HotkeyModalProps> = ({ isOpen, onClose, isDarkMode }) => {
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
      <DialogContent className={`max-w-2xl ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Keyboard Shortcuts</DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Quick reference for all available keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className={`text-sm font-semibold mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {shortcut.description}
                    </span>
                    <kbd className={`px-2 py-1 text-xs font-mono rounded ${
                      isDarkMode 
                        ? 'bg-gray-600 text-gray-200 border border-gray-500' 
                        : 'bg-white text-gray-700 border border-gray-300'
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
          isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
        }`}>
          Press <kbd className={`px-1.5 py-0.5 mx-1 font-mono rounded ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-300 border border-gray-600' 
              : 'bg-gray-100 text-gray-600 border border-gray-300'
          }`}>?</kbd> or <kbd className={`px-1.5 py-0.5 mx-1 font-mono rounded ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-300 border border-gray-600' 
              : 'bg-gray-100 text-gray-600 border border-gray-300'
          }`}>Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HotkeyModal;