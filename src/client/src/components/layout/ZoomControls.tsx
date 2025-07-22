import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Sun, Moon, Pencil, X } from "lucide-react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isDrawingMode?: boolean;
  onToggleDrawing?: () => void;
  onClearDrawing?: () => void;
  hasDrawing?: boolean;
  className?: string;
}

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  isDarkMode,
  onToggleTheme,
  isDrawingMode = false,
  onToggleDrawing,
  onClearDrawing,
  hasDrawing = false,
  className = ''
}: ZoomControlsProps) {
  return (
    <div className={`absolute bottom-4 right-4 flex flex-col items-center bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-600 p-1 z-50 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        title="Zoom in (↑)"
        className="h-8 w-8"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        title="Zoom out (↓)"
        className="h-8 w-8"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onFitToScreen}
        title="Fit to screen (F)"
        className="h-8 w-8"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      {onToggleDrawing && (
        <>
          <div className="w-full h-px bg-neutral-200 dark:bg-neutral-600 my-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDrawing}
            title={isDrawingMode ? "Exit drawing mode" : "Draw on diagram"}
            className={`h-8 w-8 ${isDrawingMode ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' : ''}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {hasDrawing && onClearDrawing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearDrawing}
              title="Clear drawing"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
      <div className="w-full h-px bg-neutral-200 dark:bg-neutral-600 my-1" />
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleTheme}
        title={isDarkMode ? "Switch to light mode (D)" : "Switch to dark mode (D)"}
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
