'use client';
import { useWalletMonitoringContext } from '@/providers/WalletMonitoringProvider';
import { AddressTracker } from '@/components/WalletMonitoring/AddressTracker';
import { MonitoredAddressList } from '@/components/WalletMonitoring/MonitoredAddressList';
import { TransactionList } from '@/components/WalletMonitoring/TransactionList';
import { MonitoringStatus } from '@/components/WalletMonitoring/MonitoringStatus';
import { ConnectionIndicator } from '@/components/WalletMonitoring/ConnectionIndicator';

export default function WalletMonitoringPage() {
    const {
        addresses,
        transactions,
        isLoading,
        error,
        isConnected,
        trackAddress,
        stopMonitoring,
        switchToAddress,
    } = useWalletMonitoringContext();

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Wallet Monitoring</h1>
                <p className="text-muted-foreground">
                    Track Bitcoin addresses and get real-time notifications for new transactions
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Add address and status */}
                <div className="space-y-6">
                    <AddressTracker 
                        onTrackAddress={trackAddress}
                        isLoading={isLoading}
                    />
                    <MonitoringStatus 
                        isConnected={isConnected}
                        addressCount={addresses.length}
                        error={error}
                    />
                </div>

                {/* Middle column - Monitored addresses */}
                <div>
                    <MonitoredAddressList
                        addresses={addresses}
                        onStopMonitoring={stopMonitoring}
                        onSwitchTracking={switchToAddress}
                        isLoading={isLoading}
                    />
                </div>

                {/* Right column - Transactions */}
                <div>
                    <TransactionList transactions={transactions} />
                </div>
            </div>

            <ConnectionIndicator />
        </div>
    );
}