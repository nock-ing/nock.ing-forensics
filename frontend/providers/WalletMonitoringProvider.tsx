'use client';
import React, { createContext, useContext, useEffect } from 'react';
import { useWalletMonitoring } from '@/hooks/use-wallet-monitoring';

interface WalletMonitoringContextType {
    isConnected: boolean;
    addresses: any[];
    transactions: any[];
    error: string | null;
    isLoading: boolean;
    trackAddress: (address: string, label?: string) => Promise<void>;
    stopMonitoring: (addressId: number) => Promise<void>;
    switchToAddress: (address: string) => Promise<void>;
}

const WalletMonitoringContext = createContext<WalletMonitoringContextType | null>(null);

export function WalletMonitoringProvider({ children }: { children: React.ReactNode }) {
    const walletMonitoring = useWalletMonitoring();

    return (
        <WalletMonitoringContext.Provider value={walletMonitoring}>
            {children}
        </WalletMonitoringContext.Provider>
    );
}

export function useWalletMonitoringContext() {
    const context = useContext(WalletMonitoringContext);
    if (!context) {
        throw new Error('useWalletMonitoringContext must be used within a WalletMonitoringProvider');
    }
    return context;
}