import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ChevronLeft,
  Download,
  Sun,
  Moon,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import mermaid from "mermaid";

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
  },
});

function App() {
  const [diagram, setDiagram] = useState(`graph TB
    subgraph "MCP Server"
        MCP[MCP Protocol Handler]
        WS[WebSocket Server<br/>:3001/ws]
        API[REST API<br/>:3001/api]
        FS[Fastify Static<br/>Server]
    end
    
    subgraph "React UI"
        VITE[Vite Dev Server<br/>:5173]
        APP[React App]
        EDITOR[Editor Panel<br/>Mermaid Syntax]
        PREVIEW[Preview Panel<br/>Rendered Diagram]
        THEME[Dark/Light Toggle]
    end
    
    subgraph "Claude Desktop"
        CLAUDE[Claude App]
        TOOL[MCP Tools]
    end
    
    CLAUDE -->|stdio| MCP
    TOOL -->|render_mermaid| MCP
    APP -->|WebSocket| WS
    APP -->|HTTP| API
    VITE -->|Proxy| API
    VITE -->|Proxy| WS
    FS -->|Serves| APP
    EDITOR -->|Auto-render| PREVIEW
    THEME -->|Controls| PREVIEW
    
    style MCP fill:#e1f5fe
    style APP fill:#f3e5f5
    style CLAUDE fill:#fff3e0`);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [hasManuallyZoomed, setHasManuallyZoomed] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<any>(null);

  // WebSocket connection with auto-reconnect
  useEffect(() => {
    let websocket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      websocket = new WebSocket("ws://localhost:3001/ws");

      websocket.onopen = () => {
        console.log("WebSocket connected to", websocket.url);
        setConnectionStatus("Connected");
      };

      websocket.onmessage = async (event) => {
        console.log("WebSocket message received:", event.data);
        const data = JSON.parse(event.data);

        if (data.type === "render_result" && data.success && data.output) {
          console.log("Updating diagram from WebSocket broadcast");
          setDiagram(data.output);
          // Theme is now controlled by UI only
          setStatus("Rendered successfully (via broadcast)");
        }
      };

      websocket.onclose = () => {
        setConnectionStatus("Reconnecting...");
        // Auto-reconnect after 1 second
        reconnectTimeout = setTimeout(connect, 1000);
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("Connection error");
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      websocket.close();
    };
  }, []);

  // Render diagram
  useEffect(() => {
    if (!previewRef.current) return;

    const renderDiagram = async () => {
      try {
        // Update theme
        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkMode ? "dark" : "default",
          securityLevel: "loose",
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
          },
        });

        // Clear previous content
        previewRef.current!.innerHTML = "";

        // Generate unique ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, diagram);
        previewRef.current!.innerHTML = svg;

        // Reset pan when diagram changes and reset manual zoom flag
        setPan({ x: 0, y: 0 });
        setHasManuallyZoomed(false);

        setStatus("Rendered successfully");
      } catch (error: any) {
        previewRef.current!.innerHTML = `<div class="text-red-500 p-4">Error: ${error.message}</div>`;
        setStatus("Render error");
      }
    };

    const timeoutId = setTimeout(renderDiagram, 500);
    return () => clearTimeout(timeoutId);
  }, [diagram, isDarkMode]);

  const handleExport = () => {
    const svg = previewRef.current?.querySelector("svg");
    if (!svg) {
      setStatus("No diagram to export");
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "mermaid-diagram.svg";
    a.click();

    URL.revokeObjectURL(url);
    setStatus("SVG exported");
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
    setHasManuallyZoomed(true);
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
    setHasManuallyZoomed(true);
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHasManuallyZoomed(true);
  };

  const handleFitToScreen = (isAutoResize = false) => {
    const svgElement = previewRef.current?.querySelector('svg');
    const container = containerRef.current;
    
    if (svgElement && container) {
      // Get SVG's natural dimensions from viewBox or width/height attributes
      let svgWidth = svgElement.viewBox.baseVal.width || svgElement.width.baseVal.value;
      let svgHeight = svgElement.viewBox.baseVal.height || svgElement.height.baseVal.value;
      
      // If no viewBox, try to get from the rendered size
      if (!svgWidth || !svgHeight) {
        const bbox = svgElement.getBBox();
        svgWidth = bbox.width;
        svgHeight = bbox.height;
      }
      
      const containerRect = container.getBoundingClientRect();
      
      // Calculate scale to fit within container with padding
      const padding = 40;
      const scaleX = (containerRect.width - padding * 2) / svgWidth;
      const scaleY = (containerRect.height - padding * 2) / svgHeight;
      const fitScale = Math.min(scaleX, scaleY);
      
      // Apply the scale if valid
      if (fitScale > 0 && isFinite(fitScale)) {
        setZoom(fitScale);
        setPan({ x: 0, y: 0 });
        // Mark as manual zoom if triggered by button click
        if (!isAutoResize) {
          setHasManuallyZoomed(true);
        }
      }
    }
  };

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Wheel handler for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 0.1), 5);
    
    // Zoom towards mouse position
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = (x - rect.width / 2) / zoom;
      const dy = (y - rect.height / 2) / zoom;
      
      setPan(prev => ({
        x: prev.x - dx * (newZoom - zoom),
        y: prev.y - dy * (newZoom - zoom)
      }));
    }
    
    setZoom(newZoom);
    setHasManuallyZoomed(true);
  };

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    let timeoutId: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      // Debounce the fit calculation
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Always fit on resize unless user has manually zoomed
        if (!hasManuallyZoomed) {
          handleFitToScreen(true);
        }
      }, 300);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [hasManuallyZoomed]); // Re-setup when manual zoom state changes

  // Keyboard shortcuts and prevent browser zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser zoom
      if ((e.metaKey || e.ctrlKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
        
        // Only handle our zoom if not in textarea
        if (!(e.target instanceof HTMLTextAreaElement)) {
          switch(e.key) {
            case '+':
            case '=':
              handleZoomIn();
              break;
            case '-':
              handleZoomOut();
              break;
            case '0':
              handleZoomReset();
              break;
          }
        }
      }
    };

    // Prevent browser zoom via mouse wheel
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className={`h-screen w-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-background'}`}>
      <ResizablePanelGroup direction="horizontal" className="flex-1 relative">
        {isCollapsed && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              panelRef.current?.expand();
            }}
            className="absolute z-10"
            style={{ top: '10px', left: '10px' }}
            title="Show editor"
          >
            <FileText className="h-4 w-4" />
          </Button>
        )}
        <ResizablePanel
          ref={panelRef}
          defaultSize={50}
          minSize={20}
          maxSize={80}
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => {
            setIsCollapsed(true);
            // Fit to screen when editor is collapsed
            setTimeout(() => {
              if (!hasManuallyZoomed) {
                handleFitToScreen(true);
              } else {
                // Reset manual zoom flag on panel state change
                setHasManuallyZoomed(false);
              }
            }, 300);
          }}
          onExpand={() => {
            setIsCollapsed(false);
            // Fit to screen when editor is expanded
            setTimeout(() => {
              if (!hasManuallyZoomed) {
                handleFitToScreen(true);
              } else {
                // Reset manual zoom flag on panel state change
                setHasManuallyZoomed(false);
              }
            }, 300);
          }}
        >
          <div className={`h-full flex flex-col relative ${isCollapsed ? '' : (isDarkMode ? 'bg-gray-800' : 'bg-gray-50')}`}>
            {!isCollapsed && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    panelRef.current?.collapse();
                  }}
                  className="absolute z-10"
                  style={{ top: '10px', left: '10px' }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <textarea
                  className={`flex-1 p-4 font-mono text-sm resize-none focus:outline-none ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-50'}`}
                  style={{ paddingLeft: '70px' }}
                  value={diagram}
                  onChange={(e) => setDiagram(e.target.value)}
                  placeholder="Enter your Mermaid diagram here..."
                />
                <div className={`p-2 text-xs border-t flex justify-between ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-muted-foreground'}`}>
                  <span>WS: {connectionStatus}</span>
                  <span>{status}</span>
                </div>
              </>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50}>
          <div className={`h-full flex flex-col relative ${isDarkMode ? 'bg-gray-800' : 'bg-background'}`}>
            <div className="absolute z-10 flex items-center" style={{ top: '10px', right: '10px', gap: '10px' }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export SVG
              </Button>
            </div>
            <div 
              ref={containerRef}
              className={`flex-1 overflow-hidden relative ${isDarkMode ? 'bg-gray-850' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            >
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center',
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                <div ref={previewRef} className="[&>svg]:!max-width-none [&>svg]:!max-height-none" />
              </div>
              
              {/* Zoom Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg border p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  title="Zoom out"
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomReset}
                  title="Reset zoom"
                  className="h-8 px-3 font-mono text-xs"
                >
                  {Math.round(zoom * 100)}%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  title="Zoom in"
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFitToScreen()}
                  title="Fit to screen"
                  className="h-8 w-8 p-0"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
