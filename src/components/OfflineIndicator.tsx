import React from 'react';
import { useOnlineStatus } from '../hooks/usePWA';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-status-banner"
      className="fixed bottom-3 inset-x-4 max-w-[390px] mx-auto z-50 flex items-center justify-between gap-2.5 rounded-lg bg-[#191815]/90 border border-amber-500/40 px-3.5 py-2 text-xs font-medium text-[#F5EFE4] shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-[#D97706]" />
        <span>Offline Mode · Cached stories active</span>
      </div>
      <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
    </div>
  );
};
