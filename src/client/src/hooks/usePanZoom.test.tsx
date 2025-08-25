import { useEffect, useRef, act } from 'react'
import ReactDOM from 'react-dom/client'
import { describe, it, expect } from 'vitest'
import { usePanZoom } from './usePanZoom'

function TestHarness({
  onReady,
}: {
  onReady: (api: {
    getPan: () => { x: number; y: number }
    getZoom: () => number
    handleKeyPan: (dx: number, dy: number) => void
    handleZoomIn: () => void
    handleZoomOut: () => void
  }) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const panZoom = usePanZoom(containerRef, contentRef, { zoomStep: 2 })

  const panRef = useRef(panZoom.pan)
  const zoomRef = useRef(panZoom.zoom)

  // Keep refs updated with latest state
  useEffect(() => { panRef.current = panZoom.pan }, [panZoom.pan])
  useEffect(() => { zoomRef.current = panZoom.zoom }, [panZoom.zoom])

  useEffect(() => {
    onReady({
      getPan: () => panRef.current,
      getZoom: () => zoomRef.current,
      handleKeyPan: panZoom.handleKeyPan,
      handleZoomIn: panZoom.handleZoomIn,
      handleZoomOut: panZoom.handleZoomOut,
    })
  }, [onReady, panZoom])

  return (
    <div>
      <div ref={containerRef} />
      <div ref={contentRef} />
    </div>
  )
}

describe('usePanZoom keyboard navigation', () => {
  describe('Arrow key panning', () => {
    it('pans up when handleKeyPan is called with positive dy', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Initial pan
      expect(api.getPan()).toEqual({ x: 0, y: 0 })

      // Pan up (positive dy moves content down)
      await act(async () => { api.handleKeyPan(0, 50) })
      expect(api.getPan()).toEqual({ x: 0, y: 50 })
    })

    it('pans down when handleKeyPan is called with negative dy', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Initial pan
      expect(api.getPan()).toEqual({ x: 0, y: 0 })

      // Pan down (negative dy moves content up)
      await act(async () => { api.handleKeyPan(0, -50) })
      expect(api.getPan()).toEqual({ x: 0, y: -50 })
    })

    it('pans left when handleKeyPan is called with positive dx', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Initial pan
      expect(api.getPan()).toEqual({ x: 0, y: 0 })

      // Pan left (positive dx moves content right)
      await act(async () => { api.handleKeyPan(50, 0) })
      expect(api.getPan()).toEqual({ x: 50, y: 0 })
    })

    it('pans right when handleKeyPan is called with negative dx', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Initial pan
      expect(api.getPan()).toEqual({ x: 0, y: 0 })

      // Pan right (negative dx moves content left)
      await act(async () => { api.handleKeyPan(-50, 0) })
      expect(api.getPan()).toEqual({ x: -50, y: 0 })
    })

    it('accumulates pan movements correctly', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Initial pan
      expect(api.getPan()).toEqual({ x: 0, y: 0 })

      // Multiple pan operations should accumulate
      await act(async () => { api.handleKeyPan(30, 20) })
      expect(api.getPan()).toEqual({ x: 30, y: 20 })

      await act(async () => { api.handleKeyPan(20, -10) })
      expect(api.getPan()).toEqual({ x: 50, y: 10 })

      await act(async () => { api.handleKeyPan(-25, 15) })
      expect(api.getPan()).toEqual({ x: 25, y: 25 })
    })
  })

  describe('PageUp/PageDown zoom', () => {
    it('zooms in when handleZoomIn is called', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Initial zoom
      expect(api.getZoom()).toBeCloseTo(1)

      // Zoom in with step 2
      await act(async () => { api.handleZoomIn() })
      expect(api.getZoom()).toBeCloseTo(2)

      // Zoom in again
      await act(async () => { api.handleZoomIn() })
      expect(api.getZoom()).toBeCloseTo(4)
    })

    it('zooms out when handleZoomOut is called', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Initial zoom
      expect(api.getZoom()).toBeCloseTo(1)

      // Zoom out with step 2
      await act(async () => { api.handleZoomOut() })
      expect(api.getZoom()).toBeCloseTo(0.5)

      // Zoom out again
      await act(async () => { api.handleZoomOut() })
      expect(api.getZoom()).toBeCloseTo(0.25)
    })

    it('respects max zoom limit', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Zoom in to max (default maxZoom is 5, with step 2)
      for (let i = 0; i < 10; i++) {
        await act(async () => { api.handleZoomIn() })
      }

      // Should be capped at maxZoom (5)
      expect(api.getZoom()).toBeLessThanOrEqual(5)
      expect(api.getZoom()).toBeGreaterThan(4.9)
    })

    it('respects min zoom limit', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Zoom out to min (default minZoom is 0.1, with step 2)
      for (let i = 0; i < 10; i++) {
        await act(async () => { api.handleZoomOut() })
      }

      // Should be capped at minZoom (0.1)
      expect(api.getZoom()).toBeGreaterThanOrEqual(0.1)
      expect(api.getZoom()).toBeLessThan(0.11)
    })
  })

  describe('Combined pan and zoom', () => {
    it('maintains pan position when zooming', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Pan to a position
      await act(async () => { api.handleKeyPan(100, 50) })
      expect(api.getPan()).toEqual({ x: 100, y: 50 })

      // Zoom in - pan should be maintained
      await act(async () => { api.handleZoomIn() })
      expect(api.getPan()).toEqual({ x: 100, y: 50 })
      expect(api.getZoom()).toBeCloseTo(2)

      // Zoom out - pan should be maintained
      await act(async () => { api.handleZoomOut() })
      expect(api.getPan()).toEqual({ x: 100, y: 50 })
      expect(api.getZoom()).toBeCloseTo(1)
    })
  })

  describe('Edge cases', () => {
    it('handles extreme pan values', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Pan with very large values
      await act(async () => { api.handleKeyPan(10000, 10000) })
      expect(api.getPan()).toEqual({ x: 10000, y: 10000 })

      // Pan with negative large values
      await act(async () => { api.handleKeyPan(-20000, -20000) })
      expect(api.getPan()).toEqual({ x: -10000, y: -10000 })
    })

    it('handles zero pan movements', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Initial position
      expect(api.getPan()).toEqual({ x: 0, y: 0 })

      // Pan with zero values - should not change position
      await act(async () => { api.handleKeyPan(0, 0) })
      expect(api.getPan()).toEqual({ x: 0, y: 0 })

      // Move to a position
      await act(async () => { api.handleKeyPan(50, 50) })
      expect(api.getPan()).toEqual({ x: 50, y: 50 })

      // Pan with zero values again - should maintain position
      await act(async () => { api.handleKeyPan(0, 0) })
      expect(api.getPan()).toEqual({ x: 50, y: 50 })
    })

    it('handles fractional pan values', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Pan with fractional values
      await act(async () => { api.handleKeyPan(10.5, 20.7) })
      expect(api.getPan()).toEqual({ x: 10.5, y: 20.7 })

      // Add more fractional values
      await act(async () => { api.handleKeyPan(0.3, 0.3) })
      expect(api.getPan()).toEqual({ x: 10.8, y: 21 })
    })

    it('handles rapid sequential zoom operations', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Rapid zoom in sequence
      await act(async () => {
        api.handleZoomIn()
        api.handleZoomIn()
        api.handleZoomOut()
        api.handleZoomIn()
      })

      // Final zoom should be 1 * 2 * 2 / 2 * 2 = 4
      expect(api.getZoom()).toBeCloseTo(4)
    })

    it('handles rapid sequential pan operations', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const root = ReactDOM.createRoot(host)

      let api: any
      await act(async () => {
        root.render(<TestHarness onReady={(a) => { api = a }} />)
      })

      // Rapid pan sequence
      await act(async () => {
        api.handleKeyPan(10, 0)
        api.handleKeyPan(10, 0)
        api.handleKeyPan(0, 20)
        api.handleKeyPan(-5, -5)
      })

      // Final position should be cumulative: (10+10+0-5, 0+0+20-5) = (15, 15)
      expect(api.getPan()).toEqual({ x: 15, y: 15 })
    })
  })
})

