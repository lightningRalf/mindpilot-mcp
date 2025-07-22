import { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingCanvasProps {
  isDrawingMode: boolean;
  zoom: number;
  isDarkMode: boolean;
  clearDrawingTrigger?: number;
  onDrawingChange?: (hasDrawing: boolean) => void;
}

interface Point {
  x: number;
  y: number;
}

export function DrawingCanvas({ isDrawingMode, zoom, isDarkMode, clearDrawingTrigger, onDrawingChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  // Clear drawing when trigger changes
  useEffect(() => {
    if (clearDrawingTrigger && clearDrawingTrigger > 0) {
      setPaths([]);
      setCurrentPath([]);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      onDrawingChange?.(false);
    }
  }, [clearDrawingTrigger, onDrawingChange]);

  const redrawPaths = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all paths - no transformation needed since canvas is inside transformed container
    paths.forEach(path => {
      if (path.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = isDarkMode ? '#00ff00' : '#ff0000'; // green in dark mode, red in light mode
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    });
  }, [paths, isDarkMode]);

  // Update canvas size and redraw when window resizes or container changes
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        const parent = canvas.parentElement;
        // Get the full size of the parent container
        canvas.width = parent.scrollWidth;
        canvas.height = parent.scrollHeight;
        redrawPaths();
      }
    };

    updateCanvasSize();
    
    // Use ResizeObserver to detect container size changes
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    let resizeObserver: ResizeObserver | null = null;
    
    if (parent) {
      resizeObserver = new ResizeObserver(updateCanvasSize);
      resizeObserver.observe(parent);
    }
    
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [redrawPaths]);

  // Update canvas size when drawing mode changes
  useEffect(() => {
    if (isDrawingMode) {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        redrawPaths();
      }
    }
  }, [isDrawingMode, redrawPaths]);

  // Redraw all paths when paths or drawing mode changes
  useEffect(() => {
    redrawPaths();
  }, [paths, redrawPaths, isDrawingMode]);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Since the canvas is inside the transformed container,
    // we need to get coordinates relative to the canvas itself
    const rect = canvas.getBoundingClientRect();
    
    // Account for the scaling - the canvas is scaled up by zoom
    // so we need to scale down the mouse coordinates
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    return { x, y };
  }, [zoom]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return;
    
    const point = screenToCanvas(e);
    if (point) {
      setIsDrawing(true);
      setCurrentPath([point]);
    }
  }, [isDrawingMode, screenToCanvas]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode) return;

    const point = screenToCanvas(e);
    if (!point) return;

    setCurrentPath(prev => [...prev, point]);

    // Draw only the new segment
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || currentPath.length < 1) return;

    ctx.beginPath();
    ctx.strokeStyle = isDarkMode ? '#00ff00' : '#ff0000'; // green in dark mode, red in light mode
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Get the last point from currentPath - no transformation needed
    const lastPoint = currentPath[currentPath.length - 1];

    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    onDrawingChange?.(true);
  }, [isDrawing, isDrawingMode, currentPath, screenToCanvas, onDrawingChange, isDarkMode]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && currentPath.length > 1) {
      setPaths([...paths, currentPath]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, paths]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 w-full h-full ${isDrawingMode ? '' : 'pointer-events-none'}`}
      style={{ zIndex: isDrawingMode ? 10 : 5 }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
}