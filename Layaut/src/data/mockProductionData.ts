/**
 * TypeScript interface for station status
 */
export interface StationStatus {
  id: string;
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'MAINTENANCE';
  type?: string;
  oee?: number;
  productionCount?: number;
  targetCount?: number;
  cycleTime?: number;
  operator?: string;
  lastUpdate?: string;
}

/**
 * Extended station information interface
 */
export interface StationInfo extends StationStatus {
  type: string;
  oee: number;
  productionCount: number;
  targetCount: number;
  cycleTime: number;
  operator: string;
  lastUpdate: string;
}

/**
 * Mock production data for factory stations
 * This will be replaced with real-time data from WebSocket/API later
 */
export const mockStations: StationStatus[] = [
  { id: 'ST01', status: 'RUNNING' },
  { id: 'ST02', status: 'ERROR' },
  { id: 'ST03', status: 'STOPPED' },
  { id: 'ST04', status: 'RUNNING' },
  { id: 'ST05', status: 'MAINTENANCE' },
  { id: 'ST06', status: 'RUNNING' },
];

/**
 * Station type mapping
 */
export const stationTypes: Record<string, string> = {
  'ST01': 'WELDING',
  'ST02': 'ASSEMBLY',
  'ST03': 'PAINTING',
  'ST04': 'INSPECTION',
  'ST05': 'TESTING',
  'ST06': 'PACKAGING',
};

/**
 * Get detailed station information
 */
export const getStationInfo = (stationId: string): StationInfo => {
  const station = mockStations.find(s => s.id === stationId);
  const type = stationTypes[stationId] || 'UNKNOWN';

  // Mock detailed data based on station ID
  const mockData: Record<string, Omit<StationInfo, 'id' | 'status'>> = {
    'ST01': {
      type: 'WELDING',
      oee: 87.5,
      productionCount: 1247,
      targetCount: 1425,
      cycleTime: 42,
      operator: 'OP-1',
      lastUpdate: new Date().toLocaleTimeString('tr-TR'),
    },
    'ST02': {
      type: 'ASSEMBLY',
      oee: 0,
      productionCount: 892,
      targetCount: 1200,
      cycleTime: 38,
      operator: 'OP-2',
      lastUpdate: new Date().toLocaleTimeString('tr-TR'),
    },
    'ST03': {
      type: 'PAINTING',
      oee: 0,
      productionCount: 1056,
      targetCount: 1350,
      cycleTime: 35,
      operator: 'OP-3',
      lastUpdate: new Date().toLocaleTimeString('tr-TR'),
    },
    'ST04': {
      type: 'INSPECTION',
      oee: 92.3,
      productionCount: 1389,
      targetCount: 1500,
      cycleTime: 28,
      operator: 'OP-4',
      lastUpdate: new Date().toLocaleTimeString('tr-TR'),
    },
    'ST05': {
      type: 'TESTING',
      oee: 25,
      productionCount: 1123,
      targetCount: 1400,
      cycleTime: 45,
      operator: 'OP-5',
      lastUpdate: new Date().toLocaleTimeString('tr-TR'),
    },
    'ST06': {
      type: 'PACKAGING',
      oee: 89.1,
      productionCount: 1334,
      targetCount: 1500,
      cycleTime: 32,
      operator: 'OP-6',
      lastUpdate: new Date().toLocaleTimeString('tr-TR'),
    },
  };

  const data = mockData[stationId] || {
    type,
    oee: 0,
    productionCount: 0,
    targetCount: 0,
    cycleTime: 0,
    operator: 'N/A',
    lastUpdate: new Date().toLocaleTimeString('tr-TR'),
  };

  return {
    id: stationId,
    status: station?.status || 'STOPPED',
    ...data,
  };
};

/**
 * Helper function to get station status by ID
 */
export const getStationStatus = (id: string): StationStatus['status'] => {
  const station = mockStations.find(s => s.id === id);
  return station?.status || 'STOPPED';
};
