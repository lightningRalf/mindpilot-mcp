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
} from "@radix-ui/react-icons";
import mermaid from "mermaid";

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

function App() {
  const [diagram, setDiagram] = useState(`graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A
    C --> E[End]`);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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

  const handleRender = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setStatus("WebSocket not connected");
      return;
    }

    ws.send(
      JSON.stringify({
        type: "render",
        diagram: diagram,
      }),
    );
  };

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
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel
          defaultSize={50}
          minSize={20}
          maxSize={80}
          collapsible={true}
          collapsedSize={4}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
        >
          <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-background'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : ''}`}>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </Button>
                {!isCollapsed && (
                  <span className={`font-semibold ${isDarkMode ? 'text-gray-100' : ''}`}>Editor (Mermaid Syntax)</span>
                )}
              </div>
              {!isCollapsed && (
                <Button size="sm" onClick={handleRender}>
                  Render
                </Button>
              )}
            </div>
            {!isCollapsed && (
              <textarea
                className={`flex-1 p-4 font-mono text-sm resize-none focus:outline-none ${isDarkMode ? 'bg-gray-800 text-gray-100' : ''}`}
                value={diagram}
                onChange={(e) => setDiagram(e.target.value)}
                placeholder="Enter your Mermaid diagram here..."
              />
            )}
            {!isCollapsed && (
              <div className={`p-2 text-xs border-t ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-muted-foreground'}`}>
                {status}
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Preview</span>
              <div className="flex items-center gap-2">
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
            </div>
            <div className={`flex-1 overflow-auto p-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-850' : ''}`}>
              <div ref={previewRef} className="max-w-full max-h-full" />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
