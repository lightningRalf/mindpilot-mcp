import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Sun, Moon } from "lucide-react";

interface TopRightToolBarProps {
  isDarkMode: boolean;
  onExport: () => void;
  onToggleTheme: () => void;
  className?: string;
}

export const TopRightToolBar: React.FC<TopRightToolBarProps> = ({
  isDarkMode,
  onExport,
  onToggleTheme,
  className = ''
}) => {
  return (
    <div className={`absolute z-10 top-4 right-4 flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-600 p-1 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onExport}
        title="Export SVG"
        className="h-8 w-8"
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleTheme}
        title={
          isDarkMode ? "Switch to light mode" : "Switch to dark mode"
        }
        className="h-8 w-8"
      >
        {isDarkMode ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default TopRightToolBar;
