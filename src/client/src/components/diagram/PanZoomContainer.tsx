import { ReactNode, forwardRef } from 'react';
import { LoadingSpinner } from '@/components/common';
import { useDiagramContext } from '@/contexts';

export interface PanZoomContainerProps {
  children: ReactNode;
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  isZooming: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

export const PanZoomContainer = forwardRef<HTMLDivElement, PanZoomContainerProps>(
  function PanZoomContainer({
    children,
    zoom,
    pan,
    isPanning,
    isZooming,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
  }, ref) {
    const { isLoadingDiagram } = useDiagramContext();

    return (
      <div
        ref={ref}
        className="flex-1 overflow-hidden relative"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        {isLoadingDiagram && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <LoadingSpinner size="lg" color="orange" />
          </div>
        )}
        <div
          className="w-full h-full flex items-center justify-center"
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