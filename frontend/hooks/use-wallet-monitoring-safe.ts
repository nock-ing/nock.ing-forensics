import { useWalletMonitoringContext } from '@/providers/WalletMonitoringProvider';

export function useWalletMonitoringSafe() {
    try {
        return useWalletMonitoringContext();
    } catch {
        return {
            addresses: [],
            transactions: [],
            isLoading: false,
            error: null,
            isConnected: false,
            trackAddress: async () => {},
            stopMonitoring: async () => {},
            switchToAddress: async () => {},
        };
    }
}