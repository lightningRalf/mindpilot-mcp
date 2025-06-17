import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import mermaid from "mermaid";
import { MCPServerStatus } from "@/components/MCPServerStatus";

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("mermaid-mcp-dark-mode");
    return saved === "true";
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("mermaid-mcp-panel-collapsed");
    return saved === "true";
  });
  const [panelSize, setPanelSize] = useState(() => {
    const saved = localStorage.getItem("mermaid-mcp-panel-size");
    return saved ? parseFloat(saved) : 50;
  });
  const [status, setStatus] = useState("Ready");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [hasManuallyZoomed, setHasManuallyZoomed] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectDelay = 30000; // Max 30 seconds
  const initialReconnectDelay = 1000; // Start with 1 second
  const maxReconnectAttempts = 5; // Stop after 5 attempts (1s, 2s, 4s, 8s, 16s)

  // Store WebSocket instance in a ref so it can be accessed from other functions
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectFunctionRef = useRef<(() => void) | null>(null);

  // Shared reconnect logic with exponential backoff
  const attemptReconnect = useCallback((setupWebSocketFn: () => void) => {
    const currentAttempt = reconnectAttemptsRef.current;

    // Check if we've exceeded max attempts
    if (currentAttempt >= maxReconnectAttempts) {
      // All attempts exhausted - show red disconnected state
      setConnectionStatus("Connection timed out");
      console.log("Max reconnection attempts reached. Giving up.");
      return;
    }

    // Calculate exponential backoff delay based on current attempt
    const delay = Math.min(
      initialReconnectDelay * Math.pow(2, currentAttempt),
      maxReconnectDelay,
    );

    // Increment for next time
    reconnectAttemptsRef.current++;

    // Update with countdown after brief delay
    setTimeout(() => {
      setConnectionStatus(`Reconnecting in ${Math.round(delay / 1000)}s...`);
    }, 50);

    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Countdown timer
    let remainingSeconds = Math.round(delay / 1000);
    countdownIntervalRef.current = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        setConnectionStatus("Connecting...");
      } else {
        setConnectionStatus(`Reconnecting in ${remainingSeconds}s...`);
      }
    }, 1000);

    console.log(
      `Scheduling reconnect attempt ${reconnectAttemptsRef.current} of ${maxReconnectAttempts} in ${delay}ms`,
    );

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Schedule reconnect
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(
        `Executing reconnect attempt ${reconnectAttemptsRef.current}`,
      );
      setupWebSocketFn();
    }, delay);
  }, []);

  // Manual reconnect function
  const manualReconnect = () => {
    console.log("Manual reconnect requested");
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    // Clear any countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Reset attempts for manual reconnect
    reconnectAttemptsRef.current = 0;
    setConnectionStatus("Reconnecting...");

    // Check if websocket exists and is open
    if (
      websocketRef.current &&
      websocketRef.current.readyState !== WebSocket.CLOSED
    ) {
      // Close it, which will trigger onclose handler
      websocketRef.current.close();
    } else {
      // Websocket is already closed, need to manually trigger reconnect
      // We need to get the connect function from the useEffect scope
      // So we'll use a ref to store it
      if (connectFunctionRef.current) {
        attemptReconnect(connectFunctionRef.current);
      }
    }
  };

  // WebSocket connection with auto-reconnect
  useEffect(() => {
    let isCleaningUp = false;
    let connectTimeoutRef: NodeJS.Timeout | null = null;

    const connect = () => {
      // Don't attempt to connect if we're cleaning up
      if (isCleaningUp) return;

      // Clean up existing websocket if any
      if (
        websocketRef.current &&
        websocketRef.current.readyState !== WebSocket.CLOSED
      ) {
        websocketRef.current.close();
      }

      // Detect if we're in development mode (Vite dev server)
      const isDev = window.location.port === "5173";
      const wsUrl = isDev
        ? `ws://${window.location.hostname}:5173/ws` // Use Vite proxy
        : `ws://${window.location.hostname}:${window.location.port}/ws`; // Use same port as served

      console.log("Attempting WebSocket connection to", wsUrl);
      const websocket = new WebSocket(wsUrl);
      websocketRef.current = websocket;

      websocket.onopen = () => {
        console.log("WebSocket connected to", websocket?.url);
        setConnectionStatus("Connected");
        // Reset reconnect attempts on successful connection
        reconnectAttemptsRef.current = 0;
        // Clear any pending reconnect timeout on successful connection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        // Clear any countdown interval
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      };

      websocket.onmessage = async (event) => {
        console.log("WebSocket message received:", event.data);
        try {
          const data = JSON.parse(event.data);

          if (data.type === "render_result" && data.success && data.output) {
            console.log("Updating diagram from WebSocket broadcast");
            setDiagram(data.output);
            // Theme is now controlled by UI only
            setStatus("Rendered successfully (via broadcast)");
            
            // Reset view to fit new diagram
            setHasManuallyZoomed(false);
            // Small delay to allow diagram to render before fitting
            setTimeout(() => {
              handleFitToScreen(true);
            }, 100);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      websocket.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        console.log("Close code:", event.code, "Clean:", event.wasClean);
        console.log("Current status:", connectionStatus);
        console.log("Reconnect attempts:", reconnectAttemptsRef.current);

        // Immediately show reconnecting status to avoid red flash
        setConnectionStatus("Reconnecting...");

        // Only reconnect if we're not cleaning up
        if (!isCleaningUp) {
          attemptReconnect(connect);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        // Don't set status here - let onclose handle it
        // The onclose event will handle reconnection
      };
    };

    // Store connect function in ref for manual reconnect
    connectFunctionRef.current = connect;

    // Initial connection
    connect();

    // Cleanup function
    return () => {
      console.log("Cleaning up WebSocket connection");
      isCleaningUp = true;

      if (connectTimeoutRef) {
        clearTimeout(connectTimeoutRef);
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
        zoomTimeoutRef.current = null;
      }

      if (
        websocketRef.current &&
        websocketRef.current.readyState !== WebSocket.CLOSED
      ) {
        websocketRef.current.close();
      }
    };
  }, []); // Empty dependency array - we don't want to recreate WebSocket on status changes

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
          suppressErrorRendering: true,
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
    setZoom((prev) => Math.min(prev * 1.2, 5));
    setHasManuallyZoomed(true);
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1));
    setHasManuallyZoomed(true);
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHasManuallyZoomed(true);
  };

  const handleFitToScreen = (isAutoResize = false) => {
    const svgElement = previewRef.current?.querySelector("svg");
    const container = containerRef.current;

    if (svgElement && container) {
      // Get SVG's natural dimensions from viewBox or width/height attributes
      let svgWidth =
        svgElement.viewBox.baseVal.width || svgElement.width.baseVal.value;
      let svgHeight =
        svgElement.viewBox.baseVal.height || svgElement.height.baseVal.value;

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
    if (e.button === 0) {
      // Left click
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Ref to track zoom timeout
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Wheel handler for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    // Set zooming state to disable transitions
    setIsZooming(true);

    // Clear existing timeout
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }

    // Reset zooming state after wheel events stop
    zoomTimeoutRef.current = setTimeout(() => {
      setIsZooming(false);
    }, 150);

    // More natural zoom with logarithmic scaling
    // Detect if using trackpad (smaller delta values) vs mouse wheel (larger, discrete values)
    const isTrackpad = Math.abs(e.deltaY) < 50;
    const zoomSensitivity = isTrackpad ? 0.01 : 0.02; // Balanced sensitivity
    
    const deltaY = e.deltaY;
    
    // Apply logarithmic scaling for more natural feel
    const zoomFactor = Math.exp(-deltaY * zoomSensitivity);
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5);

    // Zoom towards mouse position
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate the point in diagram space (before zoom)
      const pointX = (x - rect.width / 2 - pan.x) / zoom;
      const pointY = (y - rect.height / 2 - pan.y) / zoom;

      // Calculate new pan to keep the same point under the mouse
      setPan({
        x: x - rect.width / 2 - pointX * newZoom,
        y: y - rect.height / 2 - pointY * newZoom,
      });
    }

    setZoom(newZoom);
    setHasManuallyZoomed(true);
  };

  // Apply dark mode class to body and save to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("mermaid-mcp-dark-mode", isDarkMode.toString());
  }, [isDarkMode]);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("mermaid-mcp-panel-collapsed", isCollapsed.toString());
  }, [isCollapsed]);

  // Apply initial collapsed state
  useEffect(() => {
    if (isCollapsed && panelRef.current?.collapse) {
      panelRef.current.collapse();
    }
  }, []);

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
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
      ) {
        e.preventDefault();

        // Only handle our zoom if not in textarea
        if (!(e.target instanceof HTMLTextAreaElement)) {
          switch (e.key) {
            case "+":
            case "=":
              handleZoomIn();
              break;
            case "-":
              handleZoomOut();
              break;
            case "0":
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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div
      className={`h-screen w-screen flex flex-col ${isDarkMode ? "bg-gray-900" : "bg-background"}`}
    >
      <ResizablePanelGroup direction="horizontal" className="flex-1 relative">
        {isCollapsed && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              panelRef.current?.expand();
            }}
            className="absolute z-10 top-4 left-4"
            title="Show editor"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        <ResizablePanel
          ref={panelRef}
          defaultSize={panelSize}
          minSize={20}
          maxSize={80}
          collapsible={true}
          collapsedSize={0}
          onResize={(size) => {
            if (size > 0) {
              setPanelSize(size);
              localStorage.setItem("mermaid-mcp-panel-size", size.toString());
            }
          }}
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
          <div
            className={`h-full flex flex-col relative ${isCollapsed ? "" : isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}
          >
            {!isCollapsed && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    panelRef.current?.collapse();
                  }}
                  className="absolute z-10 top-4 left-4"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <textarea
                  className={`flex-1 p-4 pl-[70px] font-mono text-sm resize-none focus:outline-none ${isDarkMode ? "bg-gray-800 text-gray-100" : "bg-gray-50"}`}
                  value={diagram}
                  onChange={(e) => setDiagram(e.target.value)}
                  placeholder="Enter your Mermaid diagram here..."
                />
                <div
                  className={`p-2 text-xs border-t flex justify-between items-center ${isDarkMode ? "text-gray-400 border-gray-700" : "text-muted-foreground"}`}
                >
                  <MCPServerStatus
                    connectionStatus={connectionStatus}
                    onReconnect={manualReconnect}
                    isDarkMode={isDarkMode}
                    isCollapsedView={false}
                  />
                  <span>{status}</span>
                </div>
              </>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50}>
          <div
            className={`h-full flex flex-col relative ${isDarkMode ? "bg-gray-800" : "bg-background"}`}
          >
            <div className="absolute z-10 top-4 right-4 flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                title="Export SVG"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={
                  isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div
              ref={containerRef}
              className={`flex-1 overflow-hidden relative ${isDarkMode ? "bg-gray-850" : ""}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{ cursor: isPanning ? "grabbing" : "grab" }}
            >
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center",
                  transition:
                    isPanning || isZooming ? "none" : "transform 0.1s ease-out",
                }}
              >
                <div
                  ref={previewRef}
                  className="[&>svg]:!max-width-none [&>svg]:!max-height-none"
                />
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-sky-50/90 dark:bg-sky-950/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-1">
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
                  className="h-8 px-3 text-sm min-w-[60px]"
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
                <div className="w-px h-6 bg-sky-300 dark:bg-sky-600 mx-1" />
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

              {/* MCP Server Status in bottom left when panel is collapsed */}
              {isCollapsed && (
                <div className="absolute bottom-4 left-4">
                  <MCPServerStatus
                    connectionStatus={connectionStatus}
                    onReconnect={manualReconnect}
                    isDarkMode={isDarkMode}
                    isCollapsedView={true}
                  />
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
