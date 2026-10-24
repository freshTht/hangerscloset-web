import { useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  const mediaQuery = window.matchMedia('(max-width: 600px)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
};

const getSnapshot = () => window.matchMedia('(max-width: 600px)').matches;
const getServerSnapshot = () => false;

export const useIsMobile = (): boolean => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
