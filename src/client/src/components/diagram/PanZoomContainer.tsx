import { ReactNode, forwardRef } from 'react';
import { LoadingSpinner } from '@/components/common';
import { useDiagramContext, useThemeContext } from '@/contexts';

export interface PanZoomContainerProps {
  children: ReactNode;
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  isZooming: boolean;
  isDrawingMode?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
}

export const PanZoomContainer = forwardRef<HTMLDivElement, PanZoomContainerProps>(
  function PanZoomContainer({
    children,
    zoom,
    pan,
    isPanning,
    isZooming,
    isDrawingMode = false,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
  }, ref) {
    const { isLoadingDiagram } = useDiagramContext();
    const { isDarkMode } = useThemeContext();

    return (
      <div
        ref={ref}
        className="flex-1 overflow-hidden relative"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        style={{ 
          cursor: isDrawingMode ? "crosshair" : isPanning ? "grabbing" : "grab"
        }}
      >
        {isLoadingDiagram && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <LoadingSpinner size="lg" color="orange" />
          </div>
        )}
        {/* Ultra-thin grid background that scales with zoom from cursor */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div
            style={{
              position: 'absolute',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center",
              transition: isZooming ? "none" : "transform 0.1s ease-out",
              backgroundImage: `radial-gradient(circle, ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              backgroundPosition: 'center',
              width: '400%',
              height: '400%',
              left: '-150%',
              top: '-150%',
            }}
          />
        </div>
        <div
          className="w-full h-full flex items-center justify-center relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center",
            transition: isPanning || isZooming ? "none" : "transform 0.1s ease-out",
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);