import { useState, useEffect, useCallback } from 'react';
import { getStations, getStationById, type StationStatus, type StationInfo } from '../services/api';

/**
 * İstasyonları yönetmek için custom hook
 */
export function useStations() {
  const [stations, setStations] = useState<StationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * İstasyonları yükle
   * @param isInitial - İlk yükleme mi? Sadece ilk yüklemede loading gösterilir
   */
  const fetchStations = useCallback(async (isInitial = false) => {
    try {
      // Sadece ilk yüklemede loading state'i göster
      if (isInitial) {
        setLoading(true);
      }
      setError(null);
      const data = await getStations();
      setStations(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('İstasyonlar yüklenirken hata oluştu');
      setError(error);
      console.error('Error fetching stations:', error);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Belirli bir istasyonu getir
   */
  const fetchStationById = useCallback(async (stationId: string): Promise<StationInfo | null> => {
    try {
      const station = await getStationById(stationId);
      return station;
    } catch (err) {
      console.error('Error fetching station:', err);
      return null;
    }
  }, []);

  /**
   * İlk yükleme
   */
  useEffect(() => {
    fetchStations(true); // isInitial = true, loading gösterilir
  }, [fetchStations]);

  /**
   * Periyodik güncelleme (her 5 saniyede bir)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStations(false); // isInitial = false, loading gösterilmez
    }, 5000); // 5 saniye

    return () => clearInterval(interval);
  }, [fetchStations]);

  return {
    stations,
    loading,
    error,
    refetch: fetchStations,
    getStationById: fetchStationById,
  };
}
