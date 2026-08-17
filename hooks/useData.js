'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// Memori Global Sementara (Cache) agar pindah tab jadi instan 0 detik
const globalCache = {};

export function useData(fetcherFn, dependencies = [], pollingInterval = 30000) {
  // Membuat ID unik untuk setiap request berdasarkan parameter yang dikirim
  const cacheKey = fetcherFn.toString() + JSON.stringify(dependencies);
  
  // Jika data sudah ada di cache, langsung tampilkan (tidak usah loading)
  const [data, setData] = useState(globalCache[cacheKey] || null);
  const [loading, setLoading] = useState(!globalCache[cacheKey]);
  const [error, setError] = useState(null);
  
  const isMounted = useRef(true);

  const fetchData = useCallback(async (isBackground = false) => {
    // Jangan tampilkan tulisan "Memuat..." jika ini adalah refresh background
    if (!isBackground && !globalCache[cacheKey]) {
      setLoading(true);
    }
    
    try {
      const result = await fetcherFn();
      if (isMounted.current) {
        // Simpan data terbaru ke memori cache global
        globalCache[cacheKey] = result;
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    isMounted.current = true;
    
    // Tarik data pertama kali komponen dimuat
    fetchData();

    // AUTO-REFRESH (POLLING) SETIAP 15 DETIK
    // Sistem akan diam-diam mengambil data baru dari Spreadsheet tanpa mengganggu layar
    let intervalId;
    if (pollingInterval > 0) {
      intervalId = setInterval(() => {
        fetchData(true); // true = isBackground (sembunyikan loading)
      }, pollingInterval);
    }

    return () => {
      isMounted.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchData, pollingInterval]);

  return { data, loading, error, refetch: fetchData };
}
