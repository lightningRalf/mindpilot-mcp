import { useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  handler: (event: KeyboardEvent) => void;
  description?: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  // Only trigger if target is not an input element
  ignoreInputElements?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  
  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeShortcuts = shortcutsRef.current;
      
      for (const shortcut of activeShortcuts) {
        // Skip if we should ignore input elements and target is an input
        if (shortcut.ignoreInputElements) {
          const target = event.target as HTMLElement;
          if (
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement ||
            target.contentEditable === 'true'
          ) {
            continue;
          }
        }

        // Check if key matches
        if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
          continue;
        }

        // Check modifiers
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const metaMatch = shortcut.meta ? event.metaKey : true;
        const shiftMatch = shortcut.shift !== undefined ? shortcut.shift === event.shiftKey : true;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // Special handling for shortcuts that should work with either Ctrl or Cmd
        const modifierMatch = shortcut.ctrl && !shortcut.meta
          ? (event.ctrlKey || event.metaKey) && !event.altKey
          : ctrlMatch && metaMatch && shiftMatch && altMatch;

        if (modifierMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
          break; // Only trigger one shortcut per keypress
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

// Helper to prevent default browser zoom behavior
export function usePreventBrowserZoom() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);
}