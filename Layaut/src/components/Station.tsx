import React from 'react';
import type { StationStatus } from '../data/mockProductionData';

interface StationProps {
  station: StationStatus;
  x: number;
  y: number;
  type: string;
  onClick?: (stationId: string) => void;
}

/**
 * Optional reusable Station component
 * Can be used if you want to extract station rendering logic
 */
const Station: React.FC<StationProps> = ({ station, x, y, type, onClick }) => {
  const statusClass = `status-${station.status.toLowerCase()}`;

  const handleClick = () => {
    onClick?.(station.id);
  };

  return (
    <g
      id={`Station_${station.id}`}
      className={`station ${statusClass}`}
      onClick={handleClick}
    >
      {/* Shadow */}
      <ellipse
        id={`Station_${station.id}_Shadow`}
        cx={x + 70 + 6}
        cy={y + 100 + 5}
        rx="70"
        ry="10"
        fill="#000000"
        opacity="0.2"
      />

      {/* Station Side */}
      <polygon
        id={`Station_${station.id}_Side`}
        points={`${x + 140},${y + 6} ${x + 140 + 12},${y - 12 + 6} ${x + 140 + 12},${y + 100 - 12 - 6} ${x + 140},${y + 100 - 6}`}
        fill="#2d3748"
        stroke="#5a6978"
        strokeWidth="1"
      />

      {/* Station Top */}
      <polygon
        id={`Station_${station.id}_Top`}
        points={`${x + 6},${y} ${x + 12 + 6},${y - 12} ${x + 140 + 12 - 6},${y - 12} ${x + 140 - 6},${y}`}
        fill="#4a5568"
        stroke="#5a6978"
        strokeWidth="1"
      />

      {/* Station Body */}
      <rect
        id={`Station_${station.id}_Body`}
        className="station-body"
        x={x}
        y={y}
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
        x={x + 8}
        y={y + 8}
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
        x={x + 70}
        y={y + 30}
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
        x={x + 70}
        y={y + 50}
        fontSize="10"
        fill="#9ca3af"
        textAnchor="middle"
        fontFamily="monospace"
      >
        {type}
      </text>

      {/* Status Lamp */}
      <g id={`Station_${station.id}_Status_Lamp`} className="status-lamp">
        <circle
          id={`Station_${station.id}_Status_Lamp_Outer`}
          className="status-lamp-outer"
          cx={x + 70}
          cy={y + 80}
          r="8"
          fill="#9ca3af"
          stroke="#5a6978"
          strokeWidth="1"
        />
        <circle
          id={`Station_${station.id}_Status_Lamp_Middle`}
          className="status-lamp-middle"
          cx={x + 70}
          cy={y + 80}
          r="6"
          fill="#6b7280"
        />
        <circle
          id={`Station_${station.id}_Status_Lamp_Core`}
          className="status-lamp-core"
          cx={x + 70}
          cy={y + 80}
          r="4"
          fill="#4b5563"
        />
        <circle
          id={`Station_${station.id}_Status_Lamp_Highlight`}
          cx={x + 70 - 1.5}
          cy={y + 80 - 1.5}
          r="1.5"
          fill="#ffffff"
          opacity="0.4"
        />
      </g>

      {/* Equipment Left */}
      <g id={`Station_${station.id}_Equipment_Left`}>
        <polygon
          points={`${x + 27},${y + 60} ${x + 30},${y + 57} ${x + 30},${y + 65} ${x + 27},${y + 68}`}
          fill="#2d3748"
        />
        <polygon
          points={`${x + 15},${y + 60} ${x + 18},${y + 57} ${x + 30},${y + 57} ${x + 27},${y + 60}`}
          fill="#5a6978"
        />
        <rect
          x={x + 15}
          y={y + 60}
          width="12"
          height="8"
          fill="#4a5568"
        />
      </g>

      {/* Equipment Right */}
      <g id={`Station_${station.id}_Equipment_Right`}>
        <polygon
          points={`${x + 140 - 15},${y + 60} ${x + 140 - 12},${y + 57} ${x + 140 - 12},${y + 65} ${x + 140 - 15},${y + 68}`}
          fill="#2d3748"
        />
        <polygon
          points={`${x + 140 - 27},${y + 60} ${x + 140 - 24},${y + 57} ${x + 140 - 12},${y + 57} ${x + 140 - 15},${y + 60}`}
          fill="#5a6978"
        />
        <rect
          x={x + 140 - 27}
          y={y + 60}
          width="12"
          height="8"
          fill="#4a5568"
        />
      </g>
    </g>
  );
};

export default Station;
