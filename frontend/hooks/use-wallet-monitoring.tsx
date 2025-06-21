import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { useUser } from '@/hooks/use-user';

export interface MonitoredAddress {
    id: number;
    address: string;
    label?: string;
    is_active: boolean;
    created_at: string;
}

export interface WalletTransaction {
    id: number;
    txid: string;
    address: string;
    amount: number;
    amount_btc: number;
    transaction_type: string;
    confirmed: boolean;
    first_seen: string;
}

export interface AddressToTrack {
    address: string;
    label?: string;
}

export function useWalletMonitoring() {
    const [addresses, setAddresses] = useState<MonitoredAddress[]>([]);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const router = useRouter();
    const { user } = useUser();

    // Helper function to get auth headers
    const getAuthHeaders = useCallback(() => {
        const token = getCookie("token");
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }, []);

    // Fetch monitored addresses
    const fetchAddresses = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = getCookie("token");
            const response = await fetch('/api/wallet-monitoring/addresses', {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) throw new Error('Failed to fetch addresses');
            const data = await response.json();
            setAddresses(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch addresses');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch transactions
    const fetchTransactions = useCallback(async (skip = 0, limit = 100) => {
        try {
            const token = getCookie("token");
            const response = await fetch(`/api/wallet-monitoring/transactions?skip=${skip}&limit=${limit}`, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const data = await response.json();
            if (skip === 0) {
                setTransactions(data);
            } else {
                setTransactions(prev => [...prev, ...data]);
            }
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
            return [];
        }
    }, []);

    // Track single address
    const trackAddress = useCallback(async (address: string, label?: string) => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/wallet-monitoring/track-address', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ address, label })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to track address');
            }

            await fetchAddresses();
            toast({
                title: "Address Tracking Started",
                description: `Now monitoring ${address}`,
                duration: 3000,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to track address';
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    }, [fetchAddresses, getAuthHeaders]);

    // Track multiple addresses
    const trackAddresses = useCallback(async (addressesToTrack: AddressToTrack[]) => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/wallet-monitoring/track-addresses', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ addresses: addressesToTrack })
            });

            if (!response.ok) throw new Error('Failed to track addresses');

            const result = await response.json();
            await fetchAddresses();

            toast({
                title: "Addresses Tracking Started",
                description: result.message,
                duration: 3000,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to track addresses';
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    }, [fetchAddresses, getAuthHeaders]);

    // Stop monitoring address
    const stopMonitoring = useCallback(async (addressId: number) => {
        try {
            const token = getCookie("token");
            const response = await fetch(`/api/wallet-monitoring/address/${addressId}`, {
                method: 'DELETE',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) throw new Error('Failed to stop monitoring');

            await fetchAddresses();
            toast({
                title: "Monitoring Stopped",
                description: "Address monitoring has been stopped",
                duration: 3000,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to stop monitoring';
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
                duration: 5000,
            });
        }
    }, [fetchAddresses]);

    // Switch tracking to specific address
    const switchToAddress = useCallback(async (address: string) => {
        try {
            const response = await fetch('/api/wallet-monitoring/switch-tracking', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ address })
            });

            if (!response.ok) throw new Error('Failed to switch tracking');

            toast({
                title: "Tracking Switched",
                description: `Now actively tracking ${address}`,
                duration: 3000,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to switch tracking';
            setError(errorMessage);
        }
    }, [getAuthHeaders]);

    // WebSocket connection for real-time updates
    const connectWebSocket = useCallback(() => {
        if (!user?.id) {
            console.log('No user ID available for WebSocket connection');
            return;
        }

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        try {
            // Create WebSocket URL with user ID
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/^https?:\/\//, '') || 'localhost:8000';
            const wsUrl = `${protocol}//${host}/wallet-monitoring/ws/transactions/${user.id}`;

            console.log('Connecting to WebSocket:', wsUrl);
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
                reconnectAttempts.current = 0;
                console.log('WebSocket connected for wallet monitoring');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket message received:', data);

                    if (data.type === 'transaction') {
                        const transaction: WalletTransaction = data.transaction;

                        // Add to transactions list
                        setTransactions(prev => [transaction, ...prev]);

                        // Show toast notification with link to forensics
                        toast({
                            title: `New Transaction ${transaction.transaction_type === 'incoming' ? 'Received' : 'Sent'}`,
                            description: (
                                <div className="space-y-2">
                                    <div>Address: {transaction.address.slice(0, 10)}...</div>
                                    <div>Amount: {transaction.amount_btc} BTC</div>
                                    <button
                                        onClick={() => router.push(`/forensics?input=${transaction.txid}&isTxid=true`)}
                                        className="text-blue-500 hover:text-blue-700 underline text-sm mt-2 block"
                                    >
                                        View Transaction Details →
                                    </button>
                                </div>
                            ),
                            duration: 10000,
                        });
                    } else if (data.type === 'status') {
                        console.log('Status update:', data.status);
                    } else if (data.type === 'error') {
                        console.error('WebSocket error message:', data.message);
                        setError(data.message);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            ws.onclose = (event) => {
                setIsConnected(false);
                console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);

                // Attempt to reconnect with exponential backoff
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
                    reconnectAttempts.current++;

                    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, delay);
                } else {
                    setError('WebSocket connection failed after maximum reconnection attempts');
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('WebSocket connection error');
            };

            wsRef.current = ws;
        } catch (err) {
            console.error('Failed to create WebSocket connection:', err);
            setError('Failed to establish real-time connection');
        }
    }, [user?.id, router]);

    // Get monitoring status
    const getStatus = useCallback(async () => {
        try {
            const token = getCookie("token");
            const response = await fetch('/api/wallet-monitoring/status', {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) throw new Error('Failed to get status');
            return await response.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get status');
            return null;
        }
    }, []);

    // Initialize
    useEffect(() => {
        fetchAddresses();
        fetchTransactions();
    }, [fetchAddresses, fetchTransactions]);

    // Connect WebSocket when user is available
    useEffect(() => {
        if (user?.id) {
            connectWebSocket();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [user?.id, connectWebSocket]);

    return {
        // State
        addresses,
        transactions,
        isLoading,
        error,
        isConnected,

        // Actions
        trackAddress,
        trackAddresses,
        stopMonitoring,
        switchToAddress,
        fetchTransactions,
        getStatus,

        // Utilities
        refetch: () => {
            fetchAddresses();
            fetchTransactions();
        },
        reconnect: connectWebSocket
    };
}