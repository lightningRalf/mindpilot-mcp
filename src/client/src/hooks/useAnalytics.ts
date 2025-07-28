import { usePostHog } from 'posthog-js/react';

export function useAnalytics() {
  const posthog = usePostHog();

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  };

  const trackDiagramCreated = (properties: {
    source: 'mcp' | 'manual';
    diagramType?: string;
  }) => {
    trackEvent('diagram_created', properties);
  };

  const trackDiagramUpdated = (properties: {
    source: 'editor' | 'mcp';
    charactersCount?: number;
  }) => {
    trackEvent('diagram_updated', properties);
  };

  const trackDiagramSelected = (properties: {
    source: 'history' | 'recent';
    organizedBy: 'date' | 'project';
  }) => {
    trackEvent('diagram_selected', properties);
  };

  const trackDiagramExported = (properties: {
    format: 'png' | 'svg' | 'mermaid';
  }) => {
    trackEvent('diagram_exported', properties);
  };

  const trackDiagramDeleted = () => {
    trackEvent('diagram_deleted');
  };

  const trackPanelToggled = (properties: {
    panel: 'history' | 'editor';
    action: 'open' | 'close';
  }) => {
    trackEvent('panel_toggled', properties);
  };

  const trackThemeChanged = (properties: {
    theme: 'light' | 'dark';
  }) => {
    trackEvent('theme_changed', properties);
  };

  const trackConnectionStatusChanged = (properties: {
    status: 'connected' | 'disconnected' | 'reconnecting';
  }) => {
    trackEvent('connection_status_changed', properties);
  };

  return {
    trackEvent,
    trackDiagramCreated,
    trackDiagramUpdated,
    trackDiagramSelected,
    trackDiagramExported,
    trackDiagramDeleted,
    trackPanelToggled,
    trackThemeChanged,
    trackConnectionStatusChanged,
  };
}

