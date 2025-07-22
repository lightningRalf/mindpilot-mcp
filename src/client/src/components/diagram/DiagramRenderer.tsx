import { useEffect, useRef, forwardRef } from 'react';
import mermaid from 'mermaid';
import { useDiagramContext, useThemeContext } from '@/contexts';

export interface DiagramRendererProps {
  onFitToScreen?: (isAutoResize?: boolean) => void;
}

// Function to trim whitespace from SVG
function trimSvgWhitespace(svgElement: SVGSVGElement) {
  // Get all visible elements
  const visibleElements = svgElement.querySelectorAll('*:not(defs):not(style):not(title):not(desc)');
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  // Calculate the bounding box of all visible content
  visibleElements.forEach((element) => {
    try {
      if (element instanceof SVGGraphicsElement && element.getBBox) {
        const bbox = element.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          minX = Math.min(minX, bbox.x);
          minY = Math.min(minY, bbox.y);
          maxX = Math.max(maxX, bbox.x + bbox.width);
          maxY = Math.max(maxY, bbox.y + bbox.height);
        }
      }
    } catch (e) {
      // Some elements might not support getBBox
    }
  });
  
  // Add some padding
  const padding = 20;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  // Calculate new dimensions
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Update the viewBox and dimensions
  if (width > 0 && height > 0 && isFinite(minX) && isFinite(minY)) {
    svgElement.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    svgElement.setAttribute('width', String(width));
    svgElement.setAttribute('height', String(height));
  }
}

export const DiagramRenderer = forwardRef<HTMLDivElement, DiagramRendererProps>(
  function DiagramRenderer({ onFitToScreen }, ref) {
    const { diagram, setStatus, setIsLoadingDiagram } = useDiagramContext();
    const { isDarkMode } = useThemeContext();
    const internalRef = useRef<HTMLDivElement>(null);
    const previewRef = (ref as React.MutableRefObject<HTMLDivElement>) || internalRef;

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "strict",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
      },
    });
  }, []);

  // Render diagram
  useEffect(() => {
    if (!previewRef.current) return;

    const renderDiagram = async () => {
      try {
        // Set loading state
        setIsLoadingDiagram(true);
        
        // Clear previous content
        previewRef.current!.innerHTML = "";

        // Skip rendering if diagram is empty or null
        if (!diagram || diagram.trim() === "") {
          setIsLoadingDiagram(false);
          return;
        }

        // Update theme
        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkMode ? "dark" : "default",
          securityLevel: "strict",
          suppressErrorRendering: true,
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
          },
        });

        // Generate unique ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, diagram);
        previewRef.current!.innerHTML = svg;

        // Trim whitespace around the diagram
        const svgElement = previewRef.current!.querySelector('svg');
        if (svgElement) {
          trimSvgWhitespace(svgElement);
        }

        // Small delay to ensure SVG is fully rendered
        setTimeout(() => {
          onFitToScreen?.(true);
        }, 50);

        setStatus(diagram ? "Rendered successfully" : "Ready");
      } catch (error: any) {
        previewRef.current!.innerHTML = `<div class="text-red-500 p-4">Error: ${error.message}</div>`;
        setStatus("Render error");
      } finally {
        setIsLoadingDiagram(false);
      }
    };

    // Render immediately if diagram exists (from localStorage), otherwise wait
    const delay = diagram ? 100 : 500;
    const timeoutId = setTimeout(renderDiagram, delay);
    return () => clearTimeout(timeoutId);
  }, [diagram, isDarkMode, setStatus, setIsLoadingDiagram, onFitToScreen]);

    return (
      <div
        ref={previewRef}
        className="[&>svg]:!max-width-none [&>svg]:!max-height-none"
      />
    );
  }
);