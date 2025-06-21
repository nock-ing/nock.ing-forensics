import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';

interface AddressTrackerProps {
    onTrackAddress: (address: string, label?: string) => Promise<void>;
    isLoading: boolean;
}

export function AddressTracker({ onTrackAddress, isLoading }: AddressTrackerProps) {
    const [address, setAddress] = useState('');
    const [label, setLabel] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address.trim()) return;

        await onTrackAddress(address.trim(), label.trim() || undefined);
        setAddress('');
        setLabel('');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Track New Address
                </CardTitle>
                <CardDescription>
                    Add a Bitcoin address to monitor for incoming and outgoing transactions
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="address">Bitcoin Address</Label>
                        <Input
                            id="address"
                            placeholder="bc1q... or 1... or 3..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="label">Label (Optional)</Label>
                        <Input
                            id="label"
                            placeholder="e.g., My Main Wallet"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <Button type="submit" disabled={!address.trim() || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Start Tracking
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}