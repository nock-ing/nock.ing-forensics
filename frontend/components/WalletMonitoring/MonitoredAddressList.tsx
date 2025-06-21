import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Activity, Copy, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MonitoredAddress } from '@/hooks/use-wallet-monitoring';
import { toast } from '@/hooks/use-toast';
import {formatAddress} from "@/utils/formatters";

interface MonitoredAddressListProps {
    addresses: MonitoredAddress[];
    onStopMonitoring: (id: number) => Promise<void>;
    onSwitchTracking: (address: string) => Promise<void>;
    isLoading: boolean;
}

export function MonitoredAddressList({
                                         addresses,
                                         onStopMonitoring,
                                         onSwitchTracking,
                                         isLoading
                                     }: MonitoredAddressListProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "Address copied to clipboard",
            duration: 2000,
        });
    };

    if (addresses.length === 0) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                        <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Monitored Addresses</h3>
                        <p>Add your first Bitcoin address to start monitoring transactions</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monitored Addresses ({addresses.length})</CardTitle>
                <CardDescription>
                    Addresses currently being monitored for transactions
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {addresses.map((address) => (
                        <div key={address.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <code className="bg-muted px-2 py-1 rounded text-sm">
                                            {formatAddress(address.address)}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => copyToClipboard(address.address)}
                                            className="h-6 w-6"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    {address.label && (
                                        <p className="text-sm font-medium">{address.label}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Added {formatDistanceToNow(new Date(address.created_at))} ago
                                    </p>
                                </div>
                                <Badge variant={address.is_active ? "default" : "secondary"}>
                                    {address.is_active ? "Active" : "Inactive"}
                                </Badge>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSwitchTracking(address.address)}
                                    disabled={isLoading}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Set Active
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onStopMonitoring(address.id)}
                                    disabled={isLoading}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Stop
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}