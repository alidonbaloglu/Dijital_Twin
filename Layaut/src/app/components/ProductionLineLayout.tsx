import React from 'react';

const ProductionLineLayout: React.FC = () => {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const downloadSVG = () => {
    if (!svgRef.current) return;
    
    const svgData = svgRef.current.outerHTML;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'production-line-layout-3d.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Layout constants
  const SVG_WIDTH = 1600;
  const SVG_HEIGHT = 600;
  const FACTORY_MARGIN = 40;
  
  // Station configuration
  const STATION_WIDTH = 140;
  const STATION_HEIGHT = 100;
  const STATION_DEPTH = 12; // 3D depth effect
  const STATION_SPACING = 60;
  const CONVEYOR_WIDTH = 50;
  const CONVEYOR_HEIGHT = 8;
  const CONVEYOR_DEPTH = 4; // 3D depth for conveyors
  const OPERATOR_SPACE = 60;
  
  // Starting position
  const START_X = 80;
  const START_Y = 200;
  
  // Station definitions
  const stations = [
    { id: 'ST01', type: 'WELDING', x: START_X, y: START_Y },
    { id: 'ST02', type: 'ASSEMBLY', x: START_X + 1 * (STATION_WIDTH + STATION_SPACING + CONVEYOR_WIDTH), y: START_Y },
    { id: 'ST03', type: 'PAINTING', x: START_X + 2 * (STATION_WIDTH + STATION_SPACING + CONVEYOR_WIDTH), y: START_Y },
    { id: 'ST04', type: 'INSPECTION', x: START_X + 3 * (STATION_WIDTH + STATION_SPACING + CONVEYOR_WIDTH), y: START_Y },
    { id: 'ST05', type: 'TESTING', x: START_X + 4 * (STATION_WIDTH + STATION_SPACING + CONVEYOR_WIDTH), y: START_Y },
    { id: 'ST06', type: 'PACKAGING', x: START_X + 5 * (STATION_WIDTH + STATION_SPACING + CONVEYOR_WIDTH), y: START_Y },
  ];

  // Conveyor definitions
  const conveyors = Array.from({ length: 5 }, (_, i) => ({
    id: `0${i + 1}`,
    x: stations[i].x + STATION_WIDTH,
    y: START_Y + STATION_HEIGHT / 2 - CONVEYOR_HEIGHT / 2,
    width: STATION_SPACING + CONVEYOR_WIDTH,
  }));

  // Color scheme for 3D effect
  const colors = {
    station: {
      top: '#4a5568',      // Lighter - top surface
      front: '#3f4856',    // Medium - front face
      side: '#2d3748',     // Darker - side face
      border: '#5a6978',
    },
    conveyor: {
      top: '#5a6978',
      side: '#4a5568',
      border: '#6b7280',
    },
    statusLamp: {
      outer: '#9ca3af',
      middle: '#6b7280',
      inner: '#4b5563',
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1a1d24] p-8 relative">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="max-w-full max-h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Definitions */}
        <defs>
          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#363a45"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
          
          {/* Flow arrow marker */}
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

        {/* FACTORY FLOOR BACKGROUND */}
        <g id="Factory_Floor">
          <rect
            id="Floor_Boundary"
            x={FACTORY_MARGIN}
            y={FACTORY_MARGIN}
            width={SVG_WIDTH - FACTORY_MARGIN * 2}
            height={SVG_HEIGHT - FACTORY_MARGIN * 2}
            fill="#2a2e38"
            stroke="#3d4454"
            strokeWidth="2"
          />
          <rect
            id="Floor_Grid"
            x={FACTORY_MARGIN}
            y={FACTORY_MARGIN}
            width={SVG_WIDTH - FACTORY_MARGIN * 2}
            height={SVG_HEIGHT - FACTORY_MARGIN * 2}
            fill="url(#grid)"
          />
        </g>

        {/* HEADER SECTION */}
        <g id="Header">
          <text
            id="Title_Text"
            x={FACTORY_MARGIN + 20}
            y={FACTORY_MARGIN + 30}
            fontSize="18"
            fontWeight="600"
            fill="#e5e7eb"
            fontFamily="monospace"
          >
            PRODUCTION LINE - AUTOMOTIVE ASSEMBLY
          </text>
        </g>

        {/* NORTH WALKWAY */}
        <g id="Walkway_North">
          <line
            id="Walkway_North_Line1"
            x1={START_X - 40}
            y1={START_Y - 80}
            x2={stations[5].x + STATION_WIDTH + 40}
            y2={START_Y - 80}
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="10,5"
            opacity="0.5"
          />
          <line
            id="Walkway_North_Line2"
            x1={START_X - 40}
            y1={START_Y - 100}
            x2={stations[5].x + STATION_WIDTH + 40}
            y2={START_Y - 100}
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="10,5"
            opacity="0.5"
          />
          <text
            id="Walkway_North_Label"
            x={START_X - 35}
            y={START_Y - 85}
            fontSize="9"
            fill="#fbbf24"
            fontFamily="monospace"
            opacity="0.6"
          >
            WALKWAY
          </text>
        </g>

        {/* SOUTH WALKWAY */}
        <g id="Walkway_South">
          <line
            id="Walkway_South_Line1"
            x1={START_X - 40}
            y1={START_Y + STATION_HEIGHT + OPERATOR_SPACE + 20}
            x2={stations[5].x + STATION_WIDTH + 40}
            y2={START_Y + STATION_HEIGHT + OPERATOR_SPACE + 20}
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="10,5"
            opacity="0.5"
          />
          <line
            id="Walkway_South_Line2"
            x1={START_X - 40}
            y1={START_Y + STATION_HEIGHT + OPERATOR_SPACE + 40}
            x2={stations[5].x + STATION_WIDTH + 40}
            y2={START_Y + STATION_HEIGHT + OPERATOR_SPACE + 40}
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="10,5"
            opacity="0.5"
          />
          <text
            id="Walkway_South_Label"
            x={START_X - 35}
            y={START_Y + STATION_HEIGHT + OPERATOR_SPACE + 35}
            fontSize="9"
            fill="#fbbf24"
            fontFamily="monospace"
            opacity="0.6"
          >
            WALKWAY
          </text>
        </g>

        {/* SAFETY ZONE */}
        <g id="Safety_Zone">
          <line
            id="Safety_Zone_Line"
            x1={START_X - 30}
            y1={START_Y - 50}
            x2={stations[5].x + STATION_WIDTH + 30}
            y2={START_Y - 50}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="5,5"
            opacity="0.3"
          />
          <text
            id="Safety_Zone_Label"
            x={START_X - 30}
            y={START_Y - 55}
            fontSize="9"
            fill="#ef4444"
            fontFamily="monospace"
            opacity="0.5"
          >
            SAFETY ZONE
          </text>
        </g>

        {/* OPERATOR ZONES */}
        {stations.map((station, index) => (
          <g id={`Operator_Zone_${station.id}`} key={`op-zone-${station.id}`}>
            <rect
              id={`Operator_Zone_${station.id}_Area`}
              x={station.x + 10}
              y={station.y + STATION_HEIGHT}
              width={STATION_WIDTH - 20}
              height={OPERATOR_SPACE}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.3"
            />
            <circle
              id={`Operator_Zone_${station.id}_Marker_Inner`}
              cx={station.x + STATION_WIDTH / 2}
              cy={station.y + STATION_HEIGHT + OPERATOR_SPACE / 2}
              r="3"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1"
              opacity="0.4"
            />
            <circle
              id={`Operator_Zone_${station.id}_Marker_Outer`}
              cx={station.x + STATION_WIDTH / 2}
              cy={station.y + STATION_HEIGHT + OPERATOR_SPACE / 2}
              r="8"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="0.5"
              opacity="0.3"
            />
            <text
              id={`Operator_Zone_${station.id}_Label`}
              x={station.x + STATION_WIDTH / 2}
              y={station.y + STATION_HEIGHT + OPERATOR_SPACE - 5}
              fontSize="7"
              fill="#60a5fa"
              textAnchor="middle"
              fontFamily="monospace"
              opacity="0.4"
            >
              OP-{index + 1}
            </text>
          </g>
        ))}

        {/* CONVEYORS WITH 3D EFFECT */}
        {conveyors.map((conveyor, index) => {
          const centerX = conveyor.x + conveyor.width / 2;
          const centerY = conveyor.y + CONVEYOR_HEIGHT / 2;
          
          return (
            <g id={`Conveyor_${conveyor.id}`} key={`conveyor-${conveyor.id}`}>
              {/* Conveyor Right Side (3D depth) */}
              <polygon
                id={`Conveyor_${conveyor.id}_Side`}
                points={`
                  ${conveyor.x + conveyor.width},${conveyor.y}
                  ${conveyor.x + conveyor.width + CONVEYOR_DEPTH},${conveyor.y - CONVEYOR_DEPTH}
                  ${conveyor.x + conveyor.width + CONVEYOR_DEPTH},${conveyor.y + CONVEYOR_HEIGHT - CONVEYOR_DEPTH}
                  ${conveyor.x + conveyor.width},${conveyor.y + CONVEYOR_HEIGHT}
                `}
                fill={colors.conveyor.side}
                stroke={colors.conveyor.border}
                strokeWidth="0.5"
              />
              
              {/* Conveyor Top Surface */}
              <polygon
                id={`Conveyor_${conveyor.id}_Top`}
                points={`
                  ${conveyor.x},${conveyor.y}
                  ${conveyor.x + CONVEYOR_DEPTH},${conveyor.y - CONVEYOR_DEPTH}
                  ${conveyor.x + conveyor.width + CONVEYOR_DEPTH},${conveyor.y - CONVEYOR_DEPTH}
                  ${conveyor.x + conveyor.width},${conveyor.y}
                `}
                fill={colors.conveyor.top}
                stroke={colors.conveyor.border}
                strokeWidth="0.5"
              />
              
              {/* Conveyor Body (front face) */}
              <rect
                id={`Conveyor_${conveyor.id}_Body`}
                x={conveyor.x}
                y={conveyor.y}
                width={conveyor.width}
                height={CONVEYOR_HEIGHT}
                fill="#4a5568"
                stroke={colors.conveyor.border}
                strokeWidth="1"
              />
              
              {/* Conveyor Rollers */}
              {Array.from({ length: 8 }, (_, i) => (
                <line
                  id={`Conveyor_${conveyor.id}_Roller_${i + 1}`}
                  key={`roller-${i}`}
                  x1={conveyor.x + (i + 1) * (conveyor.width / 9)}
                  y1={conveyor.y}
                  x2={conveyor.x + (i + 1) * (conveyor.width / 9)}
                  y2={conveyor.y + CONVEYOR_HEIGHT}
                  stroke="#2d3748"
                  strokeWidth="1"
                />
              ))}
              
              {/* Flow Arrow */}
              <line
                id={`Conveyor_${conveyor.id}_Flow_Arrow`}
                x1={conveyor.x + 10}
                y1={centerY - 20}
                x2={conveyor.x + conveyor.width - 10}
                y2={centerY - 20}
                stroke="#60a5fa"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              
              {/* Flow Label */}
              <text
                id={`Conveyor_${conveyor.id}_Flow_Label`}
                x={centerX}
                y={centerY - 25}
                fontSize="9"
                fill="#60a5fa"
                textAnchor="middle"
                fontFamily="monospace"
              >
                FLOW
              </text>
            </g>
          );
        })}

        {/* PRODUCTION STATIONS WITH 3D EFFECT */}
        {stations.map((station, index) => (
          <g id={`Station_${station.id}`} key={`station-${station.id}`}>
            
            {/* Shadow (soft, subtle) */}
            <ellipse
              id={`Station_${station.id}_Shadow`}
              cx={station.x + STATION_WIDTH / 2 + 6}
              cy={station.y + STATION_HEIGHT + 5}
              rx={STATION_WIDTH / 2}
              ry="10"
              fill="#000000"
              opacity="0.2"
            />
            
            {/* Station Right Side Face (3D depth) */}
            <polygon
              id={`Station_${station.id}_Side`}
              points={`
                ${station.x + STATION_WIDTH},${station.y + 6}
                ${station.x + STATION_WIDTH + STATION_DEPTH},${station.y - STATION_DEPTH + 6}
                ${station.x + STATION_WIDTH + STATION_DEPTH},${station.y + STATION_HEIGHT - STATION_DEPTH - 6}
                ${station.x + STATION_WIDTH},${station.y + STATION_HEIGHT - 6}
              `}
              fill={colors.station.side}
              stroke={colors.station.border}
              strokeWidth="1"
            />
            
            {/* Station Top Face (3D depth) */}
            <polygon
              id={`Station_${station.id}_Top`}
              points={`
                ${station.x + 6},${station.y}
                ${station.x + STATION_DEPTH + 6},${station.y - STATION_DEPTH}
                ${station.x + STATION_WIDTH + STATION_DEPTH - 6},${station.y - STATION_DEPTH}
                ${station.x + STATION_WIDTH - 6},${station.y}
              `}
              fill={colors.station.top}
              stroke={colors.station.border}
              strokeWidth="1"
            />
            
            {/* Station Body (front face) */}
            <rect
              id={`Station_${station.id}_Body`}
              x={station.x}
              y={station.y}
              width={STATION_WIDTH}
              height={STATION_HEIGHT}
              rx="6"
              ry="6"
              fill={colors.station.front}
              stroke={colors.station.border}
              strokeWidth="2"
            />
            
            {/* Inner Frame */}
            <rect
              id={`Station_${station.id}_Frame`}
              x={station.x + 8}
              y={station.y + 8}
              width={STATION_WIDTH - 16}
              height={STATION_HEIGHT - 16}
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
              x={station.x + STATION_WIDTH / 2}
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
              x={station.x + STATION_WIDTH / 2}
              y={station.y + 50}
              fontSize="10"
              fill="#9ca3af"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {station.type}
            </text>
            
            {/* Status Lamp (3D dome effect with layered circles) */}
            <g id={`Station_${station.id}_Status_Lamp`}>
              {/* Outer ring (darkest) */}
              <circle
                id={`Station_${station.id}_Status_Lamp_Outer`}
                cx={station.x + STATION_WIDTH / 2}
                cy={station.y + STATION_HEIGHT - 20}
                r="8"
                fill={colors.statusLamp.outer}
                stroke={colors.station.border}
                strokeWidth="1"
              />
              {/* Middle ring */}
              <circle
                id={`Station_${station.id}_Status_Lamp_Middle`}
                cx={station.x + STATION_WIDTH / 2}
                cy={station.y + STATION_HEIGHT - 20}
                r="6"
                fill={colors.statusLamp.middle}
              />
              {/* Inner circle (lightest - this is the main status indicator) */}
              <circle
                id={`Station_${station.id}_Status_Lamp_Core`}
                cx={station.x + STATION_WIDTH / 2}
                cy={station.y + STATION_HEIGHT - 20}
                r="4"
                fill={colors.statusLamp.inner}
              />
              {/* Highlight spot for 3D dome effect */}
              <circle
                id={`Station_${station.id}_Status_Lamp_Highlight`}
                cx={station.x + STATION_WIDTH / 2 - 1.5}
                cy={station.y + STATION_HEIGHT - 21.5}
                r="1.5"
                fill="#ffffff"
                opacity="0.4"
              />
            </g>
            
            {/* Equipment Details (3D boxes) */}
            <g id={`Station_${station.id}_Equipment_Left`}>
              {/* Left equipment side */}
              <polygon
                points={`
                  ${station.x + 27},${station.y + 60}
                  ${station.x + 30},${station.y + 57}
                  ${station.x + 30},${station.y + 65}
                  ${station.x + 27},${station.y + 68}
                `}
                fill="#2d3748"
              />
              {/* Left equipment top */}
              <polygon
                points={`
                  ${station.x + 15},${station.y + 60}
                  ${station.x + 18},${station.y + 57}
                  ${station.x + 30},${station.y + 57}
                  ${station.x + 27},${station.y + 60}
                `}
                fill="#5a6978"
              />
              {/* Left equipment front */}
              <rect
                x={station.x + 15}
                y={station.y + 60}
                width={12}
                height={8}
                fill="#4a5568"
              />
            </g>
            
            <g id={`Station_${station.id}_Equipment_Right`}>
              {/* Right equipment side */}
              <polygon
                points={`
                  ${station.x + STATION_WIDTH - 15},${station.y + 60}
                  ${station.x + STATION_WIDTH - 12},${station.y + 57}
                  ${station.x + STATION_WIDTH - 12},${station.y + 65}
                  ${station.x + STATION_WIDTH - 15},${station.y + 68}
                `}
                fill="#2d3748"
              />
              {/* Right equipment top */}
              <polygon
                points={`
                  ${station.x + STATION_WIDTH - 27},${station.y + 60}
                  ${station.x + STATION_WIDTH - 24},${station.y + 57}
                  ${station.x + STATION_WIDTH - 12},${station.y + 57}
                  ${station.x + STATION_WIDTH - 15},${station.y + 60}
                `}
                fill="#5a6978"
              />
              {/* Right equipment front */}
              <rect
                x={station.x + STATION_WIDTH - 27}
                y={station.y + 60}
                width={12}
                height={8}
                fill="#4a5568"
              />
            </g>
          </g>
        ))}

        {/* LEGEND */}
        <g id="Legend" transform={`translate(${SVG_WIDTH - 200}, ${SVG_HEIGHT - 140})`}>
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
          
          {/* Station icon with 3D effect */}
          <g id="Legend_Station_Icon">
            <rect x="10" y="30" width="20" height="15" fill={colors.station.front} stroke={colors.station.border} strokeWidth="1" rx="2" />
            <polygon points="30,30 32,28 32,43 30,45" fill={colors.station.side} stroke={colors.station.border} strokeWidth="0.5" />
            <polygon points="10,30 12,28 32,28 30,30" fill={colors.station.top} stroke={colors.station.border} strokeWidth="0.5" />
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

        {/* FOOTER */}
        <g id="Footer">
          <text
            id="Footer_Info"
            x={FACTORY_MARGIN + 20}
            y={SVG_HEIGHT - FACTORY_MARGIN - 15}
            fontSize="10"
            fill="#6b7280"
            fontFamily="monospace"
          >
            Layout: PROD_LINE_A1 | Scale: 1:50 | Date: 2026-01-18 | View: Isometric
          </text>
        </g>
      </svg>

      {/* Download Button */}
      <button
        className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors shadow-lg"
        onClick={downloadSVG}
      >
        Download SVG
      </button>
    </div>
  );
};

export default ProductionLineLayout;
