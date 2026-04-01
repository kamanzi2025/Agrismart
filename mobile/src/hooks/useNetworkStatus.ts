import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function check() {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsOnline(state.isConnected ?? false);
      } catch {
        setIsOnline(false);
      }
    }

    check();
    interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return isOnline;
}
