/**
 * API Service - Backend API ile iletişim
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
 * API hata yönetimi
 */
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API istekleri için yardımcı fonksiyon
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Tüm istasyonları getir
 */
export async function getStations(): Promise<StationStatus[]> {
  return fetchApi<StationStatus[]>('/api/stations');
}

/**
 * Belirli bir istasyonu getir
 */
export async function getStationById(stationId: string): Promise<StationInfo> {
  return fetchApi<StationInfo>(`/api/stations/${stationId}`);
}

/**
 * İstasyon durumunu güncelle
 */
export async function updateStationStatus(
  stationId: string,
  status: StationStatus['status']
): Promise<StationStatus> {
  return fetchApi<StationStatus>(`/api/stations/${stationId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

/**
 * İstasyon bilgilerini güncelle
 */
export async function updateStation(
  stationId: string,
  data: Partial<Omit<StationInfo, 'id' | 'status' | 'type' | 'lastUpdate'>>
): Promise<StationInfo> {
  return fetchApi<StationInfo>(`/api/stations/${stationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * İstasyon geçmişini getir
 */
export async function getStationHistory(
  stationId: string,
  limit: number = 100
): Promise<any[]> {
  return fetchApi<any[]>(`/api/stations/${stationId}/history?limit=${limit}`);
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return fetchApi<{ status: string; timestamp: string }>('/health');
}
