import { useEffect, useRef, forwardRef } from 'react';
import mermaid from 'mermaid';
import { useDiagramContext, useThemeContext } from '@/contexts';

export interface DiagramRendererProps {
  onFitToScreen?: (isAutoResize?: boolean) => void;
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
      securityLevel: "loose",
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
          securityLevel: "loose",
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

        // Small delay to ensure SVG is fully rendered
        setTimeout(() => {
          onFitToScreen?.(true);
        }, 50);

        setStatus("Rendered successfully");
      } catch (error: any) {
        previewRef.current!.innerHTML = `<div class="text-red-500 p-4">Error: ${error.message}</div>`;
        setStatus("Render error");
      } finally {
        setIsLoadingDiagram(false);
      }
    };

    const timeoutId = setTimeout(renderDiagram, 500);
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