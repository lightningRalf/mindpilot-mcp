import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Sun, Moon } from "lucide-react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  className?: string;
}

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  isDarkMode,
  onToggleTheme,
  className = ''
}: ZoomControlsProps) {
  return (
    <div className={`absolute bottom-4 right-4 flex flex-col items-center bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-600 p-1 z-50 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        title="Zoom in"
        className="h-8 w-8"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        title="Zoom out"
        className="h-8 w-8"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onFitToScreen}
        title="Fit to screen"
        className="h-8 w-8"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleTheme}
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
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
}
