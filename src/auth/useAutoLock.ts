/** Kunci otomatis saat app masuk background. */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from './useAuthStore';

export function useAutoLock(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        useAuthStore.getState().lock();
      }
    });
    return () => sub.remove();
  }, [enabled]);
}
