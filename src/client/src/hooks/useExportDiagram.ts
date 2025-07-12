import { useCallback } from 'react';
import mermaid from 'mermaid';

export interface ExportDiagramOptions {
  isDarkMode: boolean;
}

export function useExportDiagram({ isDarkMode }: ExportDiagramOptions) {
  const exportAsPng = useCallback(async (diagram: string, title: string) => {
    try {
      // Initialize mermaid with appropriate theme
      mermaid.initialize({
        startOnLoad: false,
        theme: isDarkMode ? 'dark' : 'default',
        securityLevel: 'loose',
        suppressErrorRendering: true,
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
        },
      });

      // Generate unique ID for rendering
      const id = `mermaid-export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create a temporary container for rendering
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);

      try {
        // Render the diagram
        const { svg } = await mermaid.render(id, diagram);
        tempDiv.innerHTML = svg;

        // Get the SVG element
        const svgElement = tempDiv.querySelector('svg');
        if (!svgElement) {
          throw new Error('Failed to render diagram');
        }

        // Get SVG dimensions
        const bbox = svgElement.getBBox();
        const width = bbox.width || 800;
        const height = bbox.height || 600;

        // Create canvas
        const canvas = document.createElement('canvas');
        const scale = 2; // For higher resolution
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Scale for higher resolution
        ctx.scale(scale, scale);

        // Set background
        ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Convert SVG to data URL
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        // Load SVG as image
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(svgUrl);

          // Convert to PNG and download
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }, 'image/png');
        };

        img.src = svgUrl;
      } finally {
        // Cleanup
        document.body.removeChild(tempDiv);
      }
    } catch (error) {
      console.error('Failed to export diagram:', error);
      alert('Failed to export diagram');
    }
  }, [isDarkMode]);

  return { exportAsPng };
}