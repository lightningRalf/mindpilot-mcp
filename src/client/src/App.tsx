import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useDiagramContext, useThemeContext } from "@/contexts";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ZoomControls, HotkeyModal, AppLayout } from "@/components/layout";
import { DiagramRenderer, PanZoomContainer, DiagramTitle, MermaidEditor } from "@/components/diagram";
import { useLocalStorageBoolean, useLocalStorageNumber } from "@/hooks/useLocalStorage";
import { useKeyboardShortcuts, usePreventBrowserZoom, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { usePanZoom } from "@/hooks/usePanZoom";
import { useAnalytics } from "@/hooks/useAnalytics";


export function App() {
  // Get state from contexts
  const { diagram, setDiagram, setTitle, title, collection, setCollection, currentDiagramId, setCurrentDiagramId, loadDiagramById } = useDiagramContext();
  const { isDarkMode, toggleTheme } = useThemeContext();
  const { trackThemeChanged, trackPanelToggled } = useAnalytics();

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
    handleFitToScreen,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    setHasManuallyZoomed,
  } = usePanZoom(containerRef, previewRef);





  // Shared state for forcing history refresh
  const [historyRefreshTrigger] = useState(0);

  // Handle title change from diagram title component
  const handleTitleChange = useCallback(async (newTitle: string) => {
    setTitle(newTitle);

    // If we have a current diagram ID, also save to server
    if (currentDiagramId) {
      try {
        await fetch(`/api/history/${currentDiagramId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: newTitle }),
        });

        // Don't refresh history - the history panel will update its local state
        // when it receives the title change via onCurrentDiagramTitleChange
      } catch (error) {
        console.error('Failed to update diagram title:', error);
      }
    }
  }, [setTitle, currentDiagramId]);

  // Parse URL to get initial diagram ID
  const getInitialDiagramId = () => {
    const pathMatch = window.location.pathname.match(/^\/artifacts\/([a-zA-Z0-9-]+)$/);
    return pathMatch ? pathMatch[1] : null;
  };
  
  const [urlDiagramId] = useState(getInitialDiagramId);

  // Handle showHotkeyModal event
  useEffect(() => {
    const handleShowHotkeyModal = () => {
      setShowHotkeyModal(true);
    };

    window.addEventListener('showHotkeyModal', handleShowHotkeyModal);
    return () => {
      window.removeEventListener('showHotkeyModal', handleShowHotkeyModal);
    };
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const pathMatch = window.location.pathname.match(/^\/artifacts\/([a-zA-Z0-9-]+)$/);

      if (pathMatch && pathMatch[1]) {
        const diagramId = pathMatch[1];
        if (diagramId !== currentDiagramId) {
          loadDiagramById(diagramId);
        }
      } else if (window.location.pathname === '/' && currentDiagramId) {
        // Clear selection when navigating to root
        setCurrentDiagramId(null);
        setDiagram('');
        setTitle('');
        setCollection(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentDiagramId, loadDiagramById, setCurrentDiagramId, setDiagram, setTitle, setCollection]);

  // Update URL when diagram selection changes
  const updateUrlForDiagram = useCallback((diagramId: string | null) => {
    const pathMatch = window.location.pathname.match(/^\/artifacts\/([a-zA-Z0-9-]+)$/);
    const currentUrlId = pathMatch ? pathMatch[1] : null;

    if (diagramId && diagramId !== currentUrlId) {
      window.history.pushState({}, '', `/artifacts/${diagramId}`);
    } else if (!diagramId && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  // Modified handleSelectDiagram to update URL
  const handleSelectDiagram = useCallback((diagramId: string) => {
    loadDiagramById(diagramId);
    updateUrlForDiagram(diagramId);
  }, [loadDiagramById, updateUrlForDiagram]);

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
      description: 'Zoom to fit',
      ignoreInputElements: true,
      handler: () => handleFitToScreen()
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
      currentDiagramId={currentDiagramId}
      currentDiagramTitle={title}
      onCurrentDiagramTitleChange={setTitle}
      refreshTrigger={historyRefreshTrigger}
      initialDiagramId={urlDiagramId}
    />
  );

  // Center panel content
  const centerContent = (
    <div className={`h-full flex flex-col relative ${isDarkMode ? "bg-neutral-800" : "bg-neutral-100"}`}>
      <DiagramTitle
        title={title}
        collection={collection}
        isDarkMode={isDarkMode}
        isEditable={true}
        onTitleChange={handleTitleChange}
      />

      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={() => handleFitToScreen()}
        isDarkMode={isDarkMode}
        onToggleTheme={() => {
          toggleTheme();
          trackThemeChanged({ theme: isDarkMode ? 'light' : 'dark' });
        }}
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

  const editPanelContent = (
    <div className={`h-full flex flex-col ${isDarkMode ? "bg-neutral-800" : "bg-neutral-50"}`}>
      <div className="absolute z-10 top-4 right-4 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg border border-neutral-300 dark:border-neutral-500 p-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            editPanelRef.current?.collapse();
          }}
          className="h-8 w-8 group"
          title="Hide editor (⌘E)"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {/* Header */}
      <div className={`relative px-4 py-6 border-b flex items-center justify-center font-medium ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-neutral-50 border-neutral-200 text-neutral-800'}`}>
        Mermaid Editor
      </div>

      <div className={`flex-1 p-4 ${isDarkMode ? "bg-neutral-800" : "bg-neutral-50"}`}>
        <MermaidEditor
          value={diagram}
          onChange={setDiagram}
          isDarkMode={isDarkMode}
        />
      </div>
      <div className={`p-2 text-xs border-t flex justify-end ${isDarkMode ? "text-neutral-400 border-neutral-700" : "text-muted-foreground border-neutral-300"}`}>
        <span>{status}</span>
      </div>
    </div>
  );

  const floatingElements = (
    <>
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
      onHistoryCollapse={() => {
        setIsHistoryCollapsed(true);
        trackPanelToggled({ panel: 'history', action: 'close' });
      }}
      onHistoryExpand={() => {
        setIsHistoryCollapsed(false);
        trackPanelToggled({ panel: 'history', action: 'open' });
      }}
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
        trackPanelToggled({ panel: 'editor', action: 'close' });
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
        trackPanelToggled({ panel: 'editor', action: 'open' });
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
