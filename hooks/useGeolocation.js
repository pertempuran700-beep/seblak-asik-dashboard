'use client';
import { useState, useCallback } from 'react';
import { getCurrentPosition, haversineDistance } from '@/lib/geolocation';

export function useGeolocation(officeLat, officeLng, radiusM = 100) {
  const [position, setPosition] = useState(null);
  const [distance, setDistance] = useState(null);
  const [withinRange, setWithinRange] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const locate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
      if (officeLat && officeLng) {
        const d = haversineDistance(pos.lat, pos.lng, officeLat, officeLng);
        setDistance(Math.round(d));
        setWithinRange(d <= radiusM);
      }
      return pos;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [officeLat, officeLng, radiusM]);

  return { position, distance, withinRange, error, loading, locate };
}
