import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  SunIcon,
  MoonIcon,
  FileTextIcon,
} from "@radix-ui/react-icons";
import mermaid from "mermaid";

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  flowchart: {
    useMaxWidth: true,
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
  const [ws, setWs] = useState<WebSocket | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<any>(null);

  // WebSocket connection with auto-reconnect
  useEffect(() => {
    let websocket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      websocket = new WebSocket("ws://localhost:3001/ws");

      websocket.onopen = () => {
        setStatus("Connected");
        setWs(websocket);
      };

      websocket.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "render_result" && data.success && data.output) {
          setDiagram(data.output);
          // Theme is now controlled by UI only
          setStatus("Rendered successfully (via broadcast)");
        }
      };

      websocket.onclose = () => {
        setStatus("Reconnecting...");
        setWs(null);
        // Auto-reconnect after 1 second
        reconnectTimeout = setTimeout(connect, 1000);
      };

      websocket.onerror = () => {
        setStatus("Connection error");
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
            useMaxWidth: true,
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

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
            <FileTextIcon className="h-4 w-4" />
          </Button>
        )}
        <ResizablePanel
          ref={panelRef}
          defaultSize={50}
          minSize={20}
          maxSize={80}
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
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
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <textarea
                  className={`flex-1 p-4 font-mono text-sm resize-none focus:outline-none ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-50'}`}
                  style={{ paddingLeft: '70px' }}
                  value={diagram}
                  onChange={(e) => setDiagram(e.target.value)}
                  placeholder="Enter your Mermaid diagram here..."
                />
                <div className={`p-2 text-xs border-t ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-muted-foreground'}`}>
                  {status}
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
                {isDarkMode ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export SVG
              </Button>
            </div>
            <div className={`flex-1 overflow-auto p-4 ${isDarkMode ? 'bg-gray-850' : ''}`}>
              <div ref={previewRef} className="w-full h-full flex items-center justify-center [&>svg]:!max-width-none [&>svg]:!height-auto" />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
