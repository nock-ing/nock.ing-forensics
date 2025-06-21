import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Activity } from 'lucide-react';

interface MonitoringStatusProps {
    isConnected: boolean;
    addressCount: number;
    error: string | null;
}

export function MonitoringStatus({ isConnected, addressCount, error }: MonitoringStatusProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Monitoring Status
                </CardTitle>
                <CardDescription>
                    Real-time connection and tracking status
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm">WebSocket Connection</span>
                    <Badge variant={isConnected ? "default" : "destructive"}>
                        {isConnected ? (
                            <>
                                <Wifi className="mr-1 h-3 w-3" />
                                Connected
                            </>
                        ) : (
                            <>
                                <WifiOff className="mr-1 h-3 w-3" />
                                Disconnected
                            </>
                        )}
                    </Badge>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm">Monitored Addresses</span>
                    <Badge variant="outline">{addressCount}</Badge>
                </div>

                {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        {error}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}