import React, { useEffect, useRef } from 'react';
import type { StationInfo } from '../data/mockProductionData';

interface StationInfoPopoverProps {
  station: StationInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: { x: number; y: number };
}

const StationInfoPopover: React.FC<StationInfoPopoverProps> = ({
  station,
  open,
  onOpenChange,
  position,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [open, onOpenChange]);

  if (!station || !open) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'text-green-500';
      case 'ERROR':
        return 'text-red-500';
      case 'STOPPED':
        return 'text-yellow-500';
      case 'MAINTENANCE':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'Çalışıyor';
      case 'ERROR':
        return 'Hata';
      case 'STOPPED':
        return 'Durduruldu';
      case 'MAINTENANCE':
        return 'Bakım';
      default:
        return 'Bilinmiyor';
    }
  };

  const getOeeColor = (oee: number) => {
    if (oee >= 85) return 'text-green-500';
    if (oee >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Calculate popover position with boundary checks
  const popoverWidth = 320; // w-80 = 320px
  const popoverHeight = 250; // approximate height
  const offsetY = 20; // Distance above station
  
  let popoverX = position?.x || window.innerWidth / 2;
  let popoverY = (position?.y || window.innerHeight / 2) - offsetY - popoverHeight;
  
  // Ensure popover stays within viewport
  if (popoverX < popoverWidth / 2) {
    popoverX = popoverWidth / 2;
  } else if (popoverX > window.innerWidth - popoverWidth / 2) {
    popoverX = window.innerWidth - popoverWidth / 2;
  }
  
  if (popoverY < 10) {
    popoverY = (position?.y || window.innerHeight / 2) + offsetY + 100; // Show below if no space above
  }

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-80 bg-[#2a2e38] border border-[#3d4454] text-white rounded-md shadow-lg p-4 animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${popoverX}px`,
        top: `${popoverY}px`,
        transform: 'translateX(-50%)',
      }}
    >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#3d4454] pb-2">
            <div>
              <h3 className="font-bold text-lg text-white">{station.id}</h3>
              <p className="text-sm text-gray-400">{station.type}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-right ${getStatusColor(station.status)}`}>
                <div className="text-xs font-semibold uppercase">
                  {getStatusText(station.status)}
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Kapat"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* OEE */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">OEE</span>
              <span className={`font-bold ${getOeeColor(station.oee)}`}>
                {station.oee.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-[#1a1d24] rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  station.oee >= 85
                    ? 'bg-green-500'
                    : station.oee >= 70
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${station.oee}%` }}
              />
            </div>
          </div>

          {/* Production Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#3d4454]">
            <div>
              <div className="text-xs text-gray-400">Üretim</div>
              <div className="text-lg font-semibold text-white">
                {station.productionCount.toLocaleString('tr-TR')}
              </div>
              <div className="text-xs text-gray-500">
                Hedef: {station.targetCount.toLocaleString('tr-TR')}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Döngü Süresi</div>
              <div className="text-lg font-semibold text-white">
                {station.cycleTime}s
              </div>
            </div>
          </div>

          {/* Operator & Last Update */}
          <div className="flex justify-between text-xs pt-2 border-t border-[#3d4454]">
            <div>
              <span className="text-gray-400">Operatör: </span>
              <span className="text-white">{station.operator}</span>
            </div>
            <div className="text-gray-500">{station.lastUpdate}</div>
          </div>
        </div>
    </div>
  );
};

export default StationInfoPopover;
