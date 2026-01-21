import React, { useState, useRef, useEffect } from 'react';
import { useStations } from '../hooks/useStations';
import { getStationById, type StationInfo } from '../services/api';
import { getLayoutById, ProductionLine } from '../services/layoutApi';
import StationInfoPopover from './StationInfoPopover';
import ConnectionRenderer from './LayoutEditor/ConnectionRenderer';
import Factory3DLayout from './Factory3DLayout';
import '../styles/factory.css';

import { stripSvgTags, extractViewBox } from '../utils/svgUtils';

interface FactoryLayoutProps {
  onStationClick?: (stationId: string) => void;
  useApi?: boolean; // API kullanımını açıp kapatmak için
  layoutId?: string; // Dinamik layout için layout ID
}




const FactoryLayout: React.FC<FactoryLayoutProps> = ({
  onStationClick,
  useApi = true, // Varsayılan olarak API kullan
  layoutId = 'default-production-line',
}) => {
  // API'den istasyonları yükle
  const { stations, loading: stationsLoading, error: stationsError } = useStations();

  // Layout state
  const [layout, setLayout] = useState<ProductionLine | null>(null);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [selectedStation, setSelectedStation] = useState<StationInfo | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | undefined>();
  const [is3DMode, setIs3DMode] = useState(false); // 3D view state

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load layout from API
  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLayoutLoading(true);
        const data = await getLayoutById(layoutId);
        setLayout(data);
        setLayoutError(null);
      } catch (err) {
        setLayoutError(err instanceof Error ? err.message : 'Layout yüklenemedi');
        console.error('Error loading layout:', err);
      } finally {
        setLayoutLoading(false);
      }
    };
    loadLayout();
  }, [layoutId]);

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    // Reduced sensitivity: 0.9 -> 0.95 -> 0.98, 1.1 -> 1.05 -> 1.02
    const delta = e.deltaY > 0 ? 0.98 : 1.02;
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.1), 5));
  };

  // Handle pan start
  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+Left click
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  // Handle pan move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  // Handle pan end
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  const handleStationClick = async (stationId: string, event: React.MouseEvent<SVGGElement>) => {
    console.log(`Station clicked: ${stationId}`);

    // API'den istasyon bilgilerini getir
    if (useApi) {
      try {
        const stationInfo = await getStationById(stationId);
        setSelectedStation(stationInfo);
      } catch (err) {
        console.error('Error fetching station info:', err);
        return;
      }
    } else {
      // Fallback: Mock data kullan (geliştirme için)
      const station = stations.find(s => s.id === stationId);
      if (station) {
        setSelectedStation(station as StationInfo);
      }
      return;
    }

    // Calculate popover position from click
    setPopoverPosition({ x: event.clientX, y: event.clientY });
    setPopoverOpen(true);
    onStationClick?.(stationId);
  };

  const getStationStatusClass = (stationId: string): string => {
    const station = stations.find(s => s.id === stationId);
    const status = station?.status || 'STOPPED';
    return `status-${status.toLowerCase()}`;
  };

  // Loading durumu
  if ((stationsLoading || layoutLoading) && useApi) {
    return (
      <div className="factory-container">
        <div className="text-white text-center">
          <p>Layout yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumu
  if ((stationsError || layoutError) && useApi) {
    return (
      <div className="factory-container">
        <div className="text-red-500 text-center">
          <p>Hata: {stationsError?.message || layoutError}</p>
          <p className="text-sm mt-2">Backend API'ye bağlanılamıyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="factory-layout" ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Toolbar */}
      <div className="factory-layout__toolbar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: '#2a2e38',
        borderBottom: '1px solid #3d4454',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e5e7eb' }}>{layout?.name || 'Production Line'}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              color: is3DMode ? '#fff' : '#e5e7eb',
              backgroundColor: is3DMode ? '#3b82f6' : '#3f4856',
              border: is3DMode ? '1px solid #2563eb' : '1px solid #5a6978',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              marginRight: '8px'
            }}
          >
            {is3DMode ? '↩ 2D Görünüm' : '🧊 3D Görünüm'}
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              color: '#e5e7eb',
              backgroundColor: '#3f4856',
              border: '1px solid #5a6978',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            🔍+
          </button>
          <span style={{ minWidth: '50px', textAlign: 'center', fontFamily: 'monospace', fontSize: '13px', color: '#9ca3af' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(z * 0.8, 0.1))}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              color: '#e5e7eb',
              backgroundColor: '#3f4856',
              border: '1px solid #5a6978',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            🔍-
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              color: '#e5e7eb',
              backgroundColor: '#3f4856',
              border: '1px solid #5a6978',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ⟲ Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      {is3DMode ? (
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Factory3DLayout components={layout?.components || []} />
        </div>
      ) : (
        <div
          className="factory-layout__canvas"
          style={{ flex: 1, overflow: 'hidden', position: 'relative', backgroundColor: layout?.backgroundColor || '#1a1d24' }}
          onWheel={handleWheel}
          onMouseDown={handlePanStart}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <StationInfoPopover
            station={selectedStation}
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            position={popoverPosition}
          />
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', cursor: isPanning ? 'grabbing' : 'default' }}
          >
            {/* Definitions */}
            <defs>
              <pattern id="view-grid" width={layout?.gridSize || 40} height={layout?.gridSize || 40} patternUnits="userSpaceOnUse">
                <path
                  d={`M ${layout?.gridSize || 40} 0 L 0 0 0 ${layout?.gridSize || 40}`}
                  fill="none"
                  stroke="#363a45"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              </pattern>
              <marker
                id="connection-arrow"
                markerWidth="12"
                markerHeight="12"
                refX="10"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <polygon points="0 0, 12 4, 0 8" fill="#60a5fa" />
              </marker>
            </defs>

            {/* Infinite Canvas Group */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Infinite Background */}
              <rect
                x="-50000"
                y="-50000"
                width="100000"
                height="100000"
                fill={layout?.backgroundColor || '#1a1d24'}
              />
              <rect
                x="-50000"
                y="-50000"
                width="100000"
                height="100000"
                fill="url(#view-grid)"
              />

              {/* Connections */}
              {layout?.connections?.map((connection) => (
                <ConnectionRenderer
                  key={connection.id}
                  connection={connection}
                  components={layout.components}
                  onClick={() => { }} // Read-only mode, no action
                  readOnly={true}
                />
              ))}

              {/* Dynamic Layout Components from API */}
              {layout?.components
                ?.sort((a, b) => a.zIndex - b.zIndex)
                .map((component) => {
                  const template = component.template;
                  if (!template) return null;

                  const { x, y, rotation, scaleX, scaleY } = component;
                  const { width, height, svgContent } = template;

                  // Extract inner SVG content and viewBox
                  const innerSvgContent = stripSvgTags(svgContent || '');
                  const componentViewBox = extractViewBox(svgContent || '') || `0 0 ${width} ${height}`;

                  // Get station status class if this is a station component
                  const instanceId = component.instanceName.toUpperCase();
                  const statusClass = getStationStatusClass(instanceId);

                  // Calculate scaled dimensions
                  const scaledWidth = width * scaleX;
                  const scaledHeight = height * scaleY;

                  // Safe parse customData
                  let customData = component.customData || {};
                  if (typeof customData === 'string') {
                    try {
                      customData = JSON.parse(customData);
                    } catch (e) {
                      console.error('Error parsing customData for component', component.id, e);
                      customData = {};
                    }
                  }

                  // Transform string - position and rotate only, no scale (scale is handled by SVG dimensions)
                  const transform = `translate(${x}, ${y}) rotate(${rotation}, ${scaledWidth / 2}, ${scaledHeight / 2})`;

                  return (
                    <g
                      key={component.id}
                      id={`Component_${component.instanceName}`}
                      className={`layout-component station ${statusClass}`}
                      transform={transform}
                      onClick={(e) => handleStationClick(instanceId, e)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Render SVG content with proper viewBox scaling */}
                      <svg
                        x="0"
                        y="0"
                        width={scaledWidth}
                        height={scaledHeight}
                        viewBox={componentViewBox}
                        preserveAspectRatio="none"
                        className={template.category === 'floors' ? 'floor-svg-content' : ''}
                      >
                        {/* Hide text elements inside floor components */}
                        {template.category === 'floors' && (
                          <style>{`.floor-svg-content text, .floor-svg-content rect[rx] { display: none; }`}</style>
                        )}
                        <g
                          dangerouslySetInnerHTML={{ __html: innerSvgContent }}
                          style={{
                            fill: customData?.color,
                            // If color is set, force stroke to match or be none/transparent depending on need. 
                            // Usually for floors/shapes, fill is enough. 
                            // But to be sure we don't have conflicting outlines:
                            stroke: customData?.color ? 'none' : undefined
                          }}
                        />
                      </svg>

                      {/* Instance Name Label */}
                      <text
                        x={scaledWidth / 2}
                        y={-8}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="bold"
                        fill="#e5e7eb"
                        fontFamily="monospace"
                        style={{ pointerEvents: 'none' }}
                      >
                        {component.instanceName}
                      </text>
                    </g>
                  );
                })}
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};

export default FactoryLayout;

