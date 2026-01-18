import prisma from '../config/database';
import { StationStatus } from '@prisma/client';

export interface StationData {
  id: string;
  status: StationStatus;
  type: string;
  oee: number;
  productionCount: number;
  targetCount: number;
  cycleTime: number;
  operator: string;
  lastUpdate: string;
}

/**
 * Tüm istasyonları getir
 */
export async function getAllStations(): Promise<StationData[]> {
  const stations = await prisma.station.findMany({
    orderBy: {
      stationId: 'asc',
    },
  });

  return stations.map((station) => ({
    id: station.stationId,
    status: station.status as StationStatus,
    type: station.type,
    oee: station.oee,
    productionCount: station.productionCount,
    targetCount: station.targetCount,
    cycleTime: station.cycleTime,
    operator: station.operator,
    lastUpdate: station.updatedAt.toLocaleTimeString('tr-TR'),
  }));
}

/**
 * Belirli bir istasyonu getir
 */
export async function getStationById(stationId: string): Promise<StationData | null> {
  const station = await prisma.station.findUnique({
    where: { stationId },
  });

  if (!station) {
    return null;
  }

  return {
    id: station.stationId,
    status: station.status as StationStatus,
    type: station.type,
    oee: station.oee,
    productionCount: station.productionCount,
    targetCount: station.targetCount,
    cycleTime: station.cycleTime,
    operator: station.operator,
    lastUpdate: station.updatedAt.toLocaleTimeString('tr-TR'),
  };
}

/**
 * İstasyon durumunu güncelle
 */
export async function updateStationStatus(
  stationId: string,
  status: StationStatus
): Promise<StationData> {
  const station = await prisma.station.update({
    where: { stationId },
    data: { status },
  });

  // Geçmişe kaydet
  await prisma.stationHistory.create({
    data: {
      stationId,
      status,
      oee: station.oee,
      productionCount: station.productionCount,
    },
  });

  return {
    id: station.stationId,
    status: station.status as StationStatus,
    type: station.type,
    oee: station.oee,
    productionCount: station.productionCount,
    targetCount: station.targetCount,
    cycleTime: station.cycleTime,
    operator: station.operator,
    lastUpdate: station.updatedAt.toLocaleTimeString('tr-TR'),
  };
}
