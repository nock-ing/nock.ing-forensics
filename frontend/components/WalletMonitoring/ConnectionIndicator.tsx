import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useWalletMonitoringSafe } from '@/hooks/use-wallet-monitoring-safe';

export function ConnectionIndicator() {
    const { isConnected, error, addresses } = useWalletMonitoringSafe();

    if (addresses.length === 0) {
        return null; // Don't show if no addresses are being monitored
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Badge 
                variant={isConnected ? "default" : error ? "destructive" : "secondary"}
                className="flex items-center gap-2 px-3 py-2"
            >
                {isConnected ? (
                    <>
                        <Wifi className="h-3 w-3" />
                        Monitoring Active
                    </>
                ) : error ? (
                    <>
                        <AlertCircle className="h-3 w-3" />
                        Connection Error
                    </>
                ) : (
                    <>
                        <WifiOff className="h-3 w-3" />
                        Connecting...
                    </>
                )}
            </Badge>
        </div>
    );
}