import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Pencil,
  PanelLeft,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import mermaid from "mermaid";
import { FloatingConnectionStatus } from "@/components/FloatingConnectionStatus";
import { ZoomControls } from "@/components/ZoomControls";
import { useDiagramContext, useWebSocketContext, useThemeContext } from "@/contexts";
import { MermaidEditor } from "@/components/MermaidEditor";
import { HistoryPanel } from "@/components/HistoryPanel";
import { HotkeyModal } from "@/components/HotkeyModal";
import { LoadingSpinner } from "@/components/common";
import { useLocalStorageBoolean, useLocalStorageNumber } from "@/hooks/useLocalStorage";
import { useKeyboardShortcuts, usePreventBrowserZoom, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { usePanZoom } from "@/hooks/usePanZoom";

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
  // Get state from contexts
  const { diagram, title, status, isLoadingDiagram, setDiagram, setTitle, setStatus, setIsLoadingDiagram } = useDiagramContext();
  const { connectionStatus, reconnect } = useWebSocketContext();
  const { isDarkMode, toggleTheme } = useThemeContext();
  
  // LocalStorage-backed state for UI preferences
  const [isEditCollapsed, setIsEditCollapsed] = useLocalStorageBoolean("mindpilot-mcp-edit-collapsed", true);
  const [editPanelSize, setEditPanelSize] = useLocalStorageNumber("mindpilot-mcp-edit-panel-size", 30);
  
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useLocalStorageBoolean("mindpilot-mcp-history-collapsed", false);
  const [historyPanelSize, setHistoryPanelSize] = useLocalStorageNumber("mindpilot-mcp-history-panel-size", 20);
  const [showHotkeyModal, setShowHotkeyModal] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editPanelRef = useRef<any>(null);
  const historyPanelRef = useRef<any>(null);
  
  // Use the pan/zoom hook
  const {
    zoom,
    pan,
    isPanning,
    isZooming,
    hasManuallyZoomed,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleFitToScreen,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    setHasManuallyZoomed,
  } = usePanZoom(containerRef, previewRef);




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

        // Reset manual zoom flag and fit to screen after rendering
        setHasManuallyZoomed(false);
        // Small delay to ensure SVG is fully rendered
        setTimeout(() => {
          handleFitToScreen(true);
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
  }, [diagram, isDarkMode]);

  const handleSelectDiagram = (diagramText: string, diagramTitle: string) => {
    setDiagram(diagramText);
    setTitle(diagramTitle);
    setStatus("Loaded from history");
    
    // Don't reset hasManuallyZoomed here - let the diagram render first
    // The useEffect for diagram rendering will handle the reset
  };




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

  // Keyboard shortcuts
  const shortcuts = useMemo<KeyboardShortcut[]>(() => [
    {
      key: 'b',
      ctrl: true,
      description: 'Toggle history panel',
      handler: () => {
        if (isHistoryCollapsed) {
          historyPanelRef.current?.expand();
        } else {
          historyPanelRef.current?.collapse();
        }
      }
    },
    {
      key: 'e',
      ctrl: true,
      description: 'Toggle edit panel',
      handler: () => {
        if (isEditCollapsed) {
          editPanelRef.current?.expand();
        } else {
          editPanelRef.current?.collapse();
        }
      }
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      handler: () => setShowHotkeyModal(prev => !prev)
    },
    {
      key: '+',
      ctrl: true,
      description: 'Zoom in',
      ignoreInputElements: true,
      handler: () => handleZoomIn()
    },
    {
      key: '=',
      ctrl: true,
      description: 'Zoom in',
      ignoreInputElements: true,
      handler: () => handleZoomIn()
    },
    {
      key: '-',
      ctrl: true,
      description: 'Zoom out',
      ignoreInputElements: true,
      handler: () => handleZoomOut()
    },
    {
      key: '0',
      ctrl: true,
      description: 'Reset zoom',
      ignoreInputElements: true,
      handler: () => handleZoomReset()
    }
  ], [isHistoryCollapsed, isEditCollapsed]);

  useKeyboardShortcuts(shortcuts);
  usePreventBrowserZoom();


  return (
    <div
      className={`h-screen w-screen flex flex-col ${isDarkMode ? "bg-gray-900" : "bg-neutral-900"}`}
    >
      <ResizablePanelGroup 
        direction="horizontal" 
        className="flex-1 relative"
      >
        {/* History Panel - Left Side */}
        <ResizablePanel
          ref={historyPanelRef}
          defaultSize={isHistoryCollapsed ? 0 : historyPanelSize}
          minSize={20}
          maxSize={40}
          collapsible={true}
          collapsedSize={0}
          onResize={(size) => {
            // Only save if size changed significantly (more than 0.5%)
            if (!isHistoryCollapsed && size > 1 && Math.abs(size - historyPanelSize) > 0.5) {
              setHistoryPanelSize(Math.round(size));
            }
          }}
          onCollapse={() => {
            setIsHistoryCollapsed(true);
          }}
          onExpand={() => {
            setIsHistoryCollapsed(false);
          }}
        >
          <HistoryPanel
            onSelectDiagram={handleSelectDiagram}
            isDarkMode={isDarkMode}
            isExpanded={!isHistoryCollapsed}
            currentDiagram={diagram}
            connectionStatus={connectionStatus}
            onReconnect={reconnect}
          />
        </ResizablePanel>

        <ResizableHandle className="bg-gray-300 dark:bg-gray-700" />

        {/* Center Panel - Diagram View */}
        <ResizablePanel defaultSize={50}>
          <div
            className={`h-full flex flex-col relative ${isDarkMode ? "bg-gray-800" : "bg-neutral-100"}`}
          >
            {/* Title - centered in diagram area */}
            {title && (
              <div className="absolute top-4 left-0 right-0 flex justify-center items-center pointer-events-none z-40">
                <div className={`px-4 py-1 rounded-lg backdrop-blur-md ${isDarkMode ? "bg-gray-900/50" : "bg-gray-100/50"}`}>
                  <h1 className={`text-lg font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>
                    {title}
                  </h1>
                </div>
              </div>
            )}

            {/* Zoom Controls */}
            <ZoomControls
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onFitToScreen={() => handleFitToScreen()}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />

            <div
              ref={containerRef}
              className={`flex-1 overflow-hidden relative ${isDarkMode ? "bg-gray-850" : ""}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
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
                  transition:
                    isPanning || isZooming ? "none" : "transform 0.1s ease-out",
                }}
              >
                <div
                  ref={previewRef}
                  className="[&>svg]:!max-width-none [&>svg]:!max-height-none"
                />
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="bg-gray-300 dark:bg-gray-700" />

        {/* Edit Panel - Right Side */}
        <ResizablePanel
          ref={editPanelRef}
          defaultSize={isEditCollapsed ? 0 : editPanelSize}
          minSize={25}
          maxSize={50}
          collapsible={true}
          collapsedSize={0}
          onResize={(size) => {
            // Only save if size changed significantly (more than 0.5%)
            if (!isEditCollapsed && size > 1 && Math.abs(size - editPanelSize) > 0.5) {
              setEditPanelSize(Math.round(size));
            }
          }}
          onCollapse={() => {
            setIsEditCollapsed(true);
            // Fit to screen when editor is collapsed
            setTimeout(() => {
              if (!hasManuallyZoomed) {
                handleFitToScreen(true);
              } else {
                setHasManuallyZoomed(false);
              }
            }, 300);
          }}
          onExpand={() => {
            setIsEditCollapsed(false);
            // Fit to screen when editor is expanded
            setTimeout(() => {
              if (!hasManuallyZoomed) {
                handleFitToScreen(true);
              } else {
                setHasManuallyZoomed(false);
              }
            }, 300);
          }}
        >
          <div
            className={`h-full flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}
          >
            <div className="absolute z-10 top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-500 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  editPanelRef.current?.collapse();
                }}
                className="h-8 w-8 group"
                title="Hide editor (⌘E)"
              >
                <Pencil className="h-4 w-4 group-hover:hidden" />
                <PanelRightClose className="h-4 w-4 hidden group-hover:block" />
              </Button>
            </div>
            {/* Header */}
            <div className={`relative px-4 py-6 border-b flex items-center justify-center font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>Mermaid Editor</div>

            <div className={`flex-1 p-4 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <MermaidEditor
                value={diagram}
                onChange={setDiagram}
                isDarkMode={isDarkMode}
              />
            </div>
            <div
              className={`p-2 text-xs border-t flex justify-end ${isDarkMode ? "text-gray-400 border-gray-700" : "text-muted-foreground border-gray-300"}`}
            >
              <span>{status}</span>
            </div>
          </div>
        </ResizablePanel>

        {/* Menu button - always visible */}
        <div className="absolute z-10 top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-600 p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isHistoryCollapsed) {
                historyPanelRef.current?.expand();
              } else {
                historyPanelRef.current?.collapse();
              }
            }}
            className="h-8 w-8 group"
            title={isHistoryCollapsed ? "Show history panel (⌘B)" : "Hide history panel (⌘B)"}
          >
            {isHistoryCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <>
                <PanelLeft className="h-4 w-4 group-hover:hidden" />
                <PanelLeftClose className="h-4 w-4 hidden group-hover:block" />
              </>
            )}
          </Button>
        </div>

        {/* Edit button - only when collapsed */}
        {isEditCollapsed && (
          <div className="absolute z-10 top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-600 p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                editPanelRef.current?.expand();
              }}
              className="h-8 w-8 group"
              title="Show editor (⌘E)"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </ResizablePanelGroup>



      {/* MCP Server Status in bottom left when both panels are collapsed */}
      <FloatingConnectionStatus
        isVisible={isEditCollapsed && isHistoryCollapsed}
        connectionStatus={connectionStatus}
        onReconnect={reconnect}
        isDarkMode={isDarkMode}
      />

      {/* Hotkey Modal */}
      <HotkeyModal
        isOpen={showHotkeyModal}
        onClose={() => setShowHotkeyModal(false)}
        isDarkMode={isDarkMode}
      />

    </div>
  );
}

export default App;
