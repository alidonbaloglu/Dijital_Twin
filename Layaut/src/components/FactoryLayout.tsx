import React, { useState, useRef } from 'react';
import { useStations } from '../hooks/useStations';
import { getStationById, type StationStatus, type StationInfo } from '../services/api';
import StationInfoPopover from './StationInfoPopover';
import '../styles/factory.css';

interface FactoryLayoutProps {
  onStationClick?: (stationId: string) => void;
  useApi?: boolean; // API kullanımını açıp kapatmak için
}

const FactoryLayout: React.FC<FactoryLayoutProps> = ({ 
  onStationClick,
  useApi = true, // Varsayılan olarak API kullan
}) => {
  // API'den istasyonları yükle
  const { stations, loading, error, getStationById: fetchStationById } = useStations();
  
  const [selectedStation, setSelectedStation] = useState<StationInfo | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | undefined>();
  const svgRef = useRef<SVGSVGElement>(null);

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
    
    // Find station position in SVG
    const stations = [
      { id: 'ST01', x: 80, y: 200 },
      { id: 'ST02', x: 330, y: 200 },
      { id: 'ST03', x: 580, y: 200 },
      { id: 'ST04', x: 830, y: 200 },
      { id: 'ST05', x: 1080, y: 200 },
      { id: 'ST06', x: 1330, y: 200 },
    ];
    
    const station = stations.find(s => s.id === stationId);
    if (station && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const svgRect = svgRef.current.viewBox.baseVal;
      
      // Calculate scale factors
      const scaleX = rect.width / svgRect.width;
      const scaleY = rect.height / svgRect.height;
      
      // Station center in SVG coordinates
      const stationCenterX = station.x + 70; // Station width / 2
      const stationCenterY = station.y + 50; // Station height / 2
      
      // Convert to screen coordinates
      const screenX = rect.left + stationCenterX * scaleX;
      const screenY = rect.top + stationCenterY * scaleY;
      
      setPopoverPosition({ x: screenX, y: screenY });
    } else {
      // Fallback to click position
      setPopoverPosition({ x: event.clientX, y: event.clientY });
    }
    
    setPopoverOpen(true);
    onStationClick?.(stationId);
  };

  const getStationStatusClass = (stationId: string): string => {
    const station = stations.find(s => s.id === stationId);
    const status = station?.status || 'STOPPED';
    return `status-${status.toLowerCase()}`;
  };

  // Loading durumu
  if (loading && useApi) {
    return (
      <div className="factory-container">
        <div className="text-white text-center">
          <p>İstasyonlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error && useApi) {
    return (
      <div className="factory-container">
        <div className="text-red-500 text-center">
          <p>Hata: {error.message}</p>
          <p className="text-sm mt-2">Backend API'ye bağlanılamıyor. Mock data kullanılıyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="factory-container">
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
        viewBox="0 0 1600 600"
        preserveAspectRatio="xMidYMid meet"
        className="max-w-full max-h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Definitions */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#363a45"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#60a5fa" />
          </marker>
        </defs>

        {/* Factory Floor */}
        <g id="Factory_Floor">
          <rect
            id="Floor_Boundary"
            x="40"
            y="40"
            width="1520"
            height="520"
            fill="#2a2e38"
            stroke="#3d4454"
            strokeWidth="2"
          />
          <rect
            id="Floor_Grid"
            x="40"
            y="40"
            width="1520"
            height="520"
            fill="url(#grid)"
          />
        </g>

        {/* Header */}
        <g id="Header">
          <text
            id="Title_Text"
            x="60"
            y="70"
            fontSize="18"
            fontWeight="600"
            fill="#e5e7eb"
            fontFamily="monospace"
          >
            PRODUCTION LINE - AUTOMOTIVE ASSEMBLY
          </text>
        </g>

        {/* Walkway North */}
        <g id="Walkway_North">
          <line
            id="Walkway_North_Line1"
            x1="40"
            y1="120"
            x2="1510"
            y2="120"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="10,5"
            opacity="0.5"
          />
          <line
            id="Walkway_North_Line2"
            x1="40"
            y1="100"
            x2="1510"
            y2="100"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="10,5"
            opacity="0.5"
          />
          <text
            id="Walkway_North_Label"
            x="45"
            y="115"
            fontSize="9"
            fill="#fbbf24"
            fontFamily="monospace"
            opacity="0.6"
          >
            WALKWAY
          </text>
        </g>

        {/* Walkway South */}
        <g id="Walkway_South">
          <line
            id="Walkway_South_Line1"
            x1="40"
            y1="380"
            x2="1510"
            y2="380"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="10,5"
            opacity="0.5"
          />
          <line
            id="Walkway_South_Line2"
            x1="40"
            y1="400"
            x2="1510"
            y2="400"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="10,5"
            opacity="0.5"
          />
          <text
            id="Walkway_South_Label"
            x="45"
            y="395"
            fontSize="9"
            fill="#fbbf24"
            fontFamily="monospace"
            opacity="0.6"
          >
            WALKWAY
          </text>
        </g>

        {/* Safety Zone */}
        <g id="Safety_Zone">
          <line
            id="Safety_Zone_Line"
            x1="50"
            y1="150"
            x2="1500"
            y2="150"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="5,5"
            opacity="0.3"
          />
          <text
            id="Safety_Zone_Label"
            x="50"
            y="145"
            fontSize="9"
            fill="#ef4444"
            fontFamily="monospace"
            opacity="0.5"
          >
            SAFETY ZONE
          </text>
        </g>

        {/* Operator Zones */}
        {['ST01', 'ST02', 'ST03', 'ST04', 'ST05', 'ST06'].map((stationId, index) => {
          const x = 90 + index * 250;
          return (
            <g key={`op-zone-${stationId}`} id={`Operator_Zone_${stationId}`}>
              <rect
                id={`Operator_Zone_${stationId}_Area`}
                x={x}
                y="300"
                width="120"
                height="60"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.3"
              />
              <circle
                id={`Operator_Zone_${stationId}_Marker_Inner`}
                cx={x + 60}
                cy="330"
                r="3"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1"
                opacity="0.4"
              />
              <circle
                id={`Operator_Zone_${stationId}_Marker_Outer`}
                cx={x + 60}
                cy="330"
                r="8"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="0.5"
                opacity="0.3"
              />
              <text
                id={`Operator_Zone_${stationId}_Label`}
                x={x + 60}
                y="355"
                fontSize="7"
                fill="#60a5fa"
                textAnchor="middle"
                fontFamily="monospace"
                opacity="0.4"
              >
                OP-{index + 1}
              </text>
            </g>
          );
        })}

        {/* Conveyors */}
        {[
          { id: '01', x: 220, y: 246, width: 110 },
          { id: '02', x: 470, y: 246, width: 110 },
          { id: '03', x: 720, y: 246, width: 110 },
          { id: '04', x: 970, y: 246, width: 110 },
          { id: '05', x: 1220, y: 246, width: 110 },
        ].map((conveyor) => (
          <g key={`conveyor-${conveyor.id}`} id={`Conveyor_${conveyor.id}`} className="conveyor">
            <polygon
              id={`Conveyor_${conveyor.id}_Side`}
              points={`${conveyor.x + conveyor.width},${conveyor.y} ${conveyor.x + conveyor.width + 4},${conveyor.y - 4} ${conveyor.x + conveyor.width + 4},${conveyor.y + 8 - 4} ${conveyor.x + conveyor.width},${conveyor.y + 8}`}
              fill="#4a5568"
              stroke="#6b7280"
              strokeWidth="0.5"
            />
            <polygon
              id={`Conveyor_${conveyor.id}_Top`}
              points={`${conveyor.x},${conveyor.y} ${conveyor.x + 4},${conveyor.y - 4} ${conveyor.x + conveyor.width + 4},${conveyor.y - 4} ${conveyor.x + conveyor.width},${conveyor.y}`}
              fill="#5a6978"
              stroke="#6b7280"
              strokeWidth="0.5"
            />
            <rect
              id={`Conveyor_${conveyor.id}_Body`}
              x={conveyor.x}
              y={conveyor.y}
              width={conveyor.width}
              height="8"
              fill="#4a5568"
              stroke="#6b7280"
              strokeWidth="1"
            />
            {Array.from({ length: 8 }, (_, i) => (
              <line
                key={`roller-${i}`}
                id={`Conveyor_${conveyor.id}_Roller_${i + 1}`}
                x1={conveyor.x + (i + 1) * (conveyor.width / 9)}
                y1={conveyor.y}
                x2={conveyor.x + (i + 1) * (conveyor.width / 9)}
                y2={conveyor.y + 8}
                stroke="#2d3748"
                strokeWidth="1"
              />
            ))}
            <line
              id={`Conveyor_${conveyor.id}_Flow_Arrow`}
              x1={conveyor.x + 10}
              y1="230"
              x2={conveyor.x + conveyor.width - 10}
              y2="230"
              stroke="#60a5fa"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            <text
              id={`Conveyor_${conveyor.id}_Flow_Label`}
              x={conveyor.x + conveyor.width / 2}
              y="225"
              fontSize="9"
              fill="#60a5fa"
              textAnchor="middle"
              fontFamily="monospace"
            >
              FLOW
            </text>
          </g>
        ))}

        {/* Production Stations */}
        {[
          { id: 'ST01', type: 'WELDING', x: 80, y: 200 },
          { id: 'ST02', type: 'ASSEMBLY', x: 330, y: 200 },
          { id: 'ST03', type: 'PAINTING', x: 580, y: 200 },
          { id: 'ST04', type: 'INSPECTION', x: 830, y: 200 },
          { id: 'ST05', type: 'TESTING', x: 1080, y: 200 },
          { id: 'ST06', type: 'PACKAGING', x: 1330, y: 200 },
        ].map((station) => {
          const statusClass = getStationStatusClass(station.id);
          return (
            <g
              key={`station-${station.id}`}
              id={`Station_${station.id}`}
              className={`station ${statusClass}`}
              onClick={(e) => handleStationClick(station.id, e)}
            >
              {/* Shadow */}
              <ellipse
                id={`Station_${station.id}_Shadow`}
                cx={station.x + 70 + 6}
                cy={station.y + 100 + 5}
                rx="70"
                ry="10"
                fill="#000000"
                opacity="0.2"
              />

              {/* Station Side */}
              <polygon
                id={`Station_${station.id}_Side`}
                points={`${station.x + 140},${station.y + 6} ${station.x + 140 + 12},${station.y - 12 + 6} ${station.x + 140 + 12},${station.y + 100 - 12 - 6} ${station.x + 140},${station.y + 100 - 6}`}
                fill="#2d3748"
                stroke="#5a6978"
                strokeWidth="1"
              />

              {/* Station Top */}
              <polygon
                id={`Station_${station.id}_Top`}
                points={`${station.x + 6},${station.y} ${station.x + 12 + 6},${station.y - 12} ${station.x + 140 + 12 - 6},${station.y - 12} ${station.x + 140 - 6},${station.y}`}
                fill="#4a5568"
                stroke="#5a6978"
                strokeWidth="1"
              />

              {/* Station Body */}
              <rect
                id={`Station_${station.id}_Body`}
                className="station-body"
                x={station.x}
                y={station.y}
                width="140"
                height="100"
                rx="6"
                ry="6"
                fill="#3f4856"
                stroke="#5a6978"
                strokeWidth="2"
              />

              {/* Inner Frame */}
              <rect
                id={`Station_${station.id}_Frame`}
                x={station.x + 8}
                y={station.y + 8}
                width="124"
                height="84"
                rx="3"
                ry="3"
                fill="none"
                stroke="#4a5568"
                strokeWidth="1"
                strokeDasharray="4,2"
              />

              {/* Station ID Label */}
              <text
                id={`Station_${station.id}_ID_Label`}
                className="station-label"
                x={station.x + 70}
                y={station.y + 30}
                fontSize="16"
                fontWeight="700"
                fill="#e5e7eb"
                textAnchor="middle"
                fontFamily="monospace"
                letterSpacing="2"
              >
                {station.id}
              </text>

              {/* Station Type Label */}
              <text
                id={`Station_${station.id}_Type_Label`}
                className="station-label"
                x={station.x + 70}
                y={station.y + 50}
                fontSize="10"
                fill="#9ca3af"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {station.type}
              </text>

              {/* Status Lamp */}
              <g id={`Station_${station.id}_Status_Lamp`} className="status-lamp">
                <circle
                  id={`Station_${station.id}_Status_Lamp_Outer`}
                  className="status-lamp-outer"
                  cx={station.x + 70}
                  cy={station.y + 80}
                  r="8"
                  fill="#9ca3af"
                  stroke="#5a6978"
                  strokeWidth="1"
                />
                <circle
                  id={`Station_${station.id}_Status_Lamp_Middle`}
                  className="status-lamp-middle"
                  cx={station.x + 70}
                  cy={station.y + 80}
                  r="6"
                  fill="#6b7280"
                />
                <circle
                  id={`Station_${station.id}_Status_Lamp_Core`}
                  className="status-lamp-core"
                  cx={station.x + 70}
                  cy={station.y + 80}
                  r="4"
                  fill="#4b5563"
                />
                <circle
                  id={`Station_${station.id}_Status_Lamp_Highlight`}
                  cx={station.x + 70 - 1.5}
                  cy={station.y + 80 - 1.5}
                  r="1.5"
                  fill="#ffffff"
                  opacity="0.4"
                />
              </g>

              {/* Equipment Left */}
              <g id={`Station_${station.id}_Equipment_Left`}>
                <polygon
                  points={`${station.x + 27},${station.y + 60} ${station.x + 30},${station.y + 57} ${station.x + 30},${station.y + 65} ${station.x + 27},${station.y + 68}`}
                  fill="#2d3748"
                />
                <polygon
                  points={`${station.x + 15},${station.y + 60} ${station.x + 18},${station.y + 57} ${station.x + 30},${station.y + 57} ${station.x + 27},${station.y + 60}`}
                  fill="#5a6978"
                />
                <rect
                  x={station.x + 15}
                  y={station.y + 60}
                  width="12"
                  height="8"
                  fill="#4a5568"
                />
              </g>

              {/* Equipment Right */}
              <g id={`Station_${station.id}_Equipment_Right`}>
                <polygon
                  points={`${station.x + 140 - 15},${station.y + 60} ${station.x + 140 - 12},${station.y + 57} ${station.x + 140 - 12},${station.y + 65} ${station.x + 140 - 15},${station.y + 68}`}
                  fill="#2d3748"
                />
                <polygon
                  points={`${station.x + 140 - 27},${station.y + 60} ${station.x + 140 - 24},${station.y + 57} ${station.x + 140 - 12},${station.y + 57} ${station.x + 140 - 15},${station.y + 60}`}
                  fill="#5a6978"
                />
                <rect
                  x={station.x + 140 - 27}
                  y={station.y + 60}
                  width="12"
                  height="8"
                  fill="#4a5568"
                />
              </g>
            </g>
          );
        })}

        {/* Legend */}
        <g id="Legend" transform="translate(1400, 460)">
          <rect
            id="Legend_Background"
            x="0"
            y="0"
            width="180"
            height="120"
            fill="#2a2e38"
            stroke="#3d4454"
            strokeWidth="1"
            rx="4"
          />
          <text
            id="Legend_Title"
            x="10"
            y="20"
            fontSize="11"
            fontWeight="600"
            fill="#e5e7eb"
            fontFamily="monospace"
          >
            LEGEND
          </text>
          <g id="Legend_Station_Icon">
            <rect x="10" y="30" width="20" height="15" fill="#3f4856" stroke="#5a6978" strokeWidth="1" rx="2" />
            <polygon points="30,30 32,28 32,43 30,45" fill="#2d3748" stroke="#5a6978" strokeWidth="0.5" />
            <polygon points="10,30 12,28 32,28 30,30" fill="#4a5568" stroke="#5a6978" strokeWidth="0.5" />
          </g>
          <text id="Legend_Station_Text" x="35" y="42" fontSize="10" fill="#9ca3af" fontFamily="monospace">Workstation</text>
          <rect id="Legend_Conveyor_Icon" x="10" y="50" width="20" height="4" fill="#4a5568" stroke="#6b7280" strokeWidth="1" />
          <text id="Legend_Conveyor_Text" x="35" y="56" fontSize="10" fill="#9ca3af" fontFamily="monospace">Conveyor Belt</text>
          <line id="Legend_Flow_Icon" x1="10" y1="70" x2="28" y2="70" stroke="#60a5fa" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <text id="Legend_Flow_Text" x="35" y="73" fontSize="10" fill="#9ca3af" fontFamily="monospace">Material Flow</text>
          <rect id="Legend_Operator_Icon" x="10" y="78" width="20" height="12" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <text id="Legend_Operator_Text" x="35" y="87" fontSize="10" fill="#9ca3af" fontFamily="monospace">Operator Zone</text>
          <line id="Legend_Walkway_Icon" x1="10" y1="100" x2="28" y2="100" stroke="#fbbf24" strokeWidth="2" strokeDasharray="10,5" opacity="0.5" />
          <text id="Legend_Walkway_Text" x="35" y="103" fontSize="10" fill="#9ca3af" fontFamily="monospace">Safety Walkway</text>
        </g>

        {/* Footer */}
        <g id="Footer">
          <text
            id="Footer_Info"
            x="60"
            y="545"
            fontSize="10"
            fill="#6b7280"
            fontFamily="monospace"
          >
            Layout: PROD_LINE_A1 | Scale: 1:50 | Date: 2026-01-18 | View: Isometric
          </text>
        </g>
      </svg>
    </div>
  );
};

export default FactoryLayout;
