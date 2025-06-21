import React from 'react';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitToScreen: () => void;
  className?: string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  className = ''
}) => {
  return (
    <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-600 p-1 z-50 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomOut}
        title="Zoom out"
        className="h-8 w-8 p-0 flex-shrink-0"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomReset}
        title="Reset zoom"
        className="h-8 w-14 text-sm text-center flex-shrink-0 font-mono"
      >
        {Math.round(zoom * 100)}%
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomIn}
        title="Zoom in"
        className="h-8 w-8 p-0 flex-shrink-0"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 flex-shrink-0" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onFitToScreen}
        title="Fit to screen"
        className="h-8 w-8 p-0 flex-shrink-0"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ZoomControls;
