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
        securityLevel: 'strict',
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

        // Clone the SVG to avoid modifying the original
        const svgClone = svgElement.cloneNode(true) as SVGElement;
        
        // Set explicit dimensions and viewBox
        const bbox = svgElement.getBBox();
        const width = bbox.width || 800;
        const height = bbox.height || 600;
        svgClone.setAttribute('width', width.toString());
        svgClone.setAttribute('height', height.toString());
        if (!svgClone.getAttribute('viewBox')) {
          svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
        
        // Add XML namespace
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Remove any external references that might taint the canvas
        // Remove all <use> elements with external references
        const useElements = svgClone.querySelectorAll('use');
        useElements.forEach(use => {
          const href = use.getAttribute('href') || use.getAttribute('xlink:href');
          if (href && href.startsWith('http')) {
            use.remove();
          }
        });
        
        // Remove any images with external sources
        const images = svgClone.querySelectorAll('image');
        images.forEach(img => {
          const href = img.getAttribute('href') || img.getAttribute('xlink:href');
          if (href && href.startsWith('http')) {
            img.remove();
          }
        });
        
        // Inline all styles from stylesheets
        const styles = svgClone.querySelectorAll('style');
        styles.forEach(style => {
          // Ensure style content doesn't reference external resources
          if (style.textContent) {
            style.textContent = style.textContent.replace(/@import\s+url\([^)]+\);?/g, '');
          }
        });

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

        // Convert SVG to data URL using the clone
        const svgData = new XMLSerializer().serializeToString(svgClone);
        // Use base64 data URL to avoid cross-origin issues
        const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
        const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;

        // Load SVG as image
        const img = new Image();
        
        // Add error handler
        img.onerror = (error) => {
          console.error('Failed to load SVG image:', error);
          throw new Error('Failed to load SVG for export');
        };
        
        img.onload = () => {
          try {
            ctx.drawImage(img, 0, 0, width, height);

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
              } else {
                console.error('Failed to create PNG blob');
                alert('Failed to create PNG file');
              }
            }, 'image/png');
          } catch (error) {
            console.error('Failed to draw image:', error);
            alert('Failed to export diagram');
          }
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

  const exportAsSvg = useCallback(async (diagram: string, title: string) => {
    try {
      // Initialize mermaid with appropriate theme
      mermaid.initialize({
        startOnLoad: false,
        theme: isDarkMode ? 'dark' : 'default',
        securityLevel: 'strict',
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

        // Set background color on SVG
        svgElement.style.backgroundColor = isDarkMode ? '#1f2937' : '#ffffff';

        // Convert SVG to string
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        // Download SVG
        const a = document.createElement('a');
        a.href = svgUrl;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(svgUrl);
      } finally {
        // Cleanup
        document.body.removeChild(tempDiv);
      }
    } catch (error) {
      console.error('Failed to export diagram:', error);
      alert('Failed to export diagram');
    }
  }, [isDarkMode]);

  const exportAsMermaid = useCallback((diagram: string, title: string) => {
    try {
      // Create a blob with the Mermaid diagram text
      const blob = new Blob([diagram], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // Download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mmd`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export Mermaid diagram:', error);
      alert('Failed to export Mermaid diagram');
    }
  }, []);

  return { exportAsPng, exportAsSvg, exportAsMermaid };
}