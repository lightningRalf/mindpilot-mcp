import { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { 
  Image,
  FileCode,
  FileImage, 
  FileText
} from "lucide-react";
import { useDiagramContext, useThemeContext } from '@/contexts';
import { useExportDiagram } from '@/hooks';

interface DiagramContextMenuProps {
  children: ReactNode;
}

export function DiagramContextMenu({ children }: DiagramContextMenuProps) {
  const { diagram, title } = useDiagramContext();
  const { isDarkMode } = useThemeContext();
  const { exportAsPng, exportAsSvg, exportAsMermaid, copyImageToClipboard } = useExportDiagram({ isDarkMode });

  const handleCopyImage = async () => {
    if (!diagram) return;
    await copyImageToClipboard(diagram, title || 'diagram');
  };

  const handleCopySource = async () => {
    if (!diagram) return;
    try {
      await navigator.clipboard.writeText(diagram);
      console.log('Source copied to clipboard');
    } catch (err) {
      console.error('Failed to copy source:', err);
      // Fallback: Select and copy text
      const textarea = document.createElement('textarea');
      textarea.value = diagram;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleSavePNG = () => {
    if (!diagram) return;
    exportAsPng(diagram, title || 'diagram');
  };

  const handleSaveSVG = () => {
    if (!diagram) return;
    exportAsSvg(diagram, title || 'diagram');
  };

  const handleSaveSource = () => {
    if (!diagram) return;
    exportAsMermaid(diagram, title || 'diagram');
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div>
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className={`w-56 ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200'}`}>
        <ContextMenuItem onClick={handleCopyImage} disabled={!diagram} className={isDarkMode ? 'hover:bg-orange-500/10 focus:bg-orange-500/10' : 'hover:bg-orange-50 focus:bg-orange-50'}>
          <Image className="mr-2 h-4 w-4" />
          Copy Image
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopySource} disabled={!diagram} className={isDarkMode ? 'hover:bg-orange-500/10 focus:bg-orange-500/10' : 'hover:bg-orange-50 focus:bg-orange-50'}>
          <FileCode className="mr-2 h-4 w-4" />
          Copy Source
        </ContextMenuItem>
        <ContextMenuSeparator className={isDarkMode ? 'bg-neutral-700' : ''} />
        <ContextMenuItem onClick={handleSavePNG} disabled={!diagram} className={isDarkMode ? 'hover:bg-orange-500/10 focus:bg-orange-500/10' : 'hover:bg-orange-50 focus:bg-orange-50'}>
          <FileImage className="mr-2 h-4 w-4" />
          Export PNG
        </ContextMenuItem>
        <ContextMenuItem onClick={handleSaveSVG} disabled={!diagram} className={isDarkMode ? 'hover:bg-orange-500/10 focus:bg-orange-500/10' : 'hover:bg-orange-50 focus:bg-orange-50'}>
          <FileText className="mr-2 h-4 w-4" />
          Export SVG
        </ContextMenuItem>
        <ContextMenuItem onClick={handleSaveSource} disabled={!diagram} className={isDarkMode ? 'hover:bg-orange-500/10 focus:bg-orange-500/10' : 'hover:bg-orange-50 focus:bg-orange-50'}>
          <FileCode className="mr-2 h-4 w-4" />
          Export Source
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}