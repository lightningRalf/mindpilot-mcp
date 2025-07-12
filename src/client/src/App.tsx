import { useState, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, PanelRightClose } from "lucide-react";
import { FloatingConnectionStatus } from "@/components/FloatingConnectionStatus";
import { ZoomControls } from "@/components/ZoomControls";
import { useDiagramContext, useWebSocketContext, useThemeContext } from "@/contexts";
import { MermaidEditor } from "@/components/MermaidEditor";
import { HistoryPanel } from "@/components/HistoryPanel";
import { HotkeyModal } from "@/components/HotkeyModal";
import { DiagramRenderer } from "@/components/DiagramRenderer";
import { PanZoomContainer } from "@/components/PanZoomContainer";
import { AppLayout } from "@/components/AppLayout";
import { useLocalStorageBoolean, useLocalStorageNumber } from "@/hooks/useLocalStorage";
import { useKeyboardShortcuts, usePreventBrowserZoom, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { usePanZoom } from "@/hooks/usePanZoom";


function App() {
  // Get state from contexts
  const { diagram, setDiagram, setTitle, setStatus, title, status } = useDiagramContext();
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




  const handleSelectDiagram = useCallback((diagramText: string, diagramTitle: string) => {
    setDiagram(diagramText);
    setTitle(diagramTitle);
    setStatus("Loaded from history");
  }, [setDiagram, setTitle, setStatus]);




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


  // Create callback for diagram onFitToScreen
  const handleDiagramFitToScreen = useCallback((isAutoResize?: boolean) => {
    if (!isAutoResize) {
      setHasManuallyZoomed(true);
    }
    handleFitToScreen(isAutoResize);
  }, [handleFitToScreen, setHasManuallyZoomed]);

  // History panel content
  const historyPanelContent = (
    <HistoryPanel
      onSelectDiagram={handleSelectDiagram}
      isDarkMode={isDarkMode}
      isExpanded={!isHistoryCollapsed}
      currentDiagram={diagram}
      connectionStatus={connectionStatus}
      onReconnect={reconnect}
    />
  );

  // Center panel content
  const centerContent = (
    <div className={`h-full flex flex-col relative ${isDarkMode ? "bg-gray-800" : "bg-neutral-100"}`}>
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

      <PanZoomContainer
        ref={containerRef}
        zoom={zoom}
        pan={pan}
        isPanning={isPanning}
        isZooming={isZooming}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <DiagramRenderer
          ref={previewRef}
          onFitToScreen={handleDiagramFitToScreen}
        />
      </PanZoomContainer>
    </div>
  );

  // Edit panel content
  const editPanelContent = (
    <div className={`h-full flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
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
      <div className={`relative px-4 py-6 border-b flex items-center justify-center font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
        Mermaid Editor
      </div>

      <div className={`flex-1 p-4 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
        <MermaidEditor
          value={diagram}
          onChange={setDiagram}
          isDarkMode={isDarkMode}
        />
      </div>
      <div className={`p-2 text-xs border-t flex justify-end ${isDarkMode ? "text-gray-400 border-gray-700" : "text-muted-foreground border-gray-300"}`}>
        <span>{status}</span>
      </div>
    </div>
  );

  // Floating elements
  const floatingElements = (
    <>
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
    </>
  );

  return (
    <AppLayout
      // History Panel
      historyPanel={historyPanelContent}
      isHistoryCollapsed={isHistoryCollapsed}
      historyPanelSize={historyPanelSize}
      onHistoryResize={setHistoryPanelSize}
      onHistoryCollapse={() => setIsHistoryCollapsed(true)}
      onHistoryExpand={() => setIsHistoryCollapsed(false)}
      historyPanelRef={historyPanelRef}
      
      // Center Content
      centerContent={centerContent}
      
      // Edit Panel
      editPanel={editPanelContent}
      isEditCollapsed={isEditCollapsed}
      editPanelSize={editPanelSize}
      onEditResize={setEditPanelSize}
      onEditCollapse={() => {
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
      onEditExpand={() => {
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
      editPanelRef={editPanelRef}
      
      // Floating elements
      floatingElements={floatingElements}
    />
  );
}

export default App;
