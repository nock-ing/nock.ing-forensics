import { useState, useCallback, useRef } from 'react';
import {getCookie} from "cookies-next";

interface Wallet {
    wallet_name?: string;
    wallet_address?: string;
    wallet_type?: string;
    balance?: number;
    suspicious_illegal_activity?: boolean;
}

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

export function useWalletApi() {
    const [state, setState] = useState<{
        addWallet: ApiResponse<Wallet>;
        getWallets: ApiResponse<Wallet[]>;
        updateWallet: ApiResponse<Wallet>;
        deleteWallet: ApiResponse<boolean>;
    }>({
        addWallet: { data: null, error: null, loading: false },
        getWallets: { data: null, error: null, loading: false },
        updateWallet: { data: null, error: null, loading: false },
        deleteWallet: { data: null, error: null, loading: false },
    });

    // Add ref to track ongoing requests and prevent duplicates
    const getWalletsRequestRef = useRef<Promise<Wallet[] | null> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const addWallet = useCallback(async (walletData: Wallet): Promise<Wallet | null> => {
        setState(prev => ({ ...prev, addWallet: { ...prev.addWallet, loading: true, error: null } }));

        try {
            const token = getCookie("token");

            const response = await fetch('/api/wallets/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(walletData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to add wallet');
            }

            setState(prev => ({ ...prev, addWallet: { data, error: null, loading: false } }));
            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setState(prev => ({
                ...prev,
                addWallet: { data: null, error: errorMessage, loading: false }
            }));
            return null;
        }
    }, []);

    const getWallets = useCallback(async (): Promise<Wallet[] | null> => {
        // Return ongoing request if it exists
        if (getWalletsRequestRef.current) {
            return getWalletsRequestRef.current;
        }

        // Cancel any previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        // Set loading state only if not already loading
        setState(prev => {
            if (prev.getWallets.loading) return prev;
            return { ...prev, getWallets: { ...prev.getWallets, loading: true, error: null } };
        });

        // Create new request
        const requestPromise = (async (): Promise<Wallet[] | null> => {
            try {
                const token = getCookie("token");

                const response = await fetch('/api/saved-wallets', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    signal: abortControllerRef.current?.signal,
                });

                // Check if request was aborted
                if (abortControllerRef.current?.signal.aborted) {
                    return null;
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || 'Failed to get wallets');
                }

                setState(prev => ({ ...prev, getWallets: { data, error: null, loading: false } }));
                return data;
            } catch (error) {
                // Don't update state if request was aborted
                if (error instanceof Error && error.name === 'AbortError') {
                    return null;
                }

                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                setState(prev => ({
                    ...prev,
                    getWallets: { data: null, error: errorMessage, loading: false }
                }));
                return null;
            } finally {
                // Clear the request ref when done
                getWalletsRequestRef.current = null;
                abortControllerRef.current = null;
            }
        })();

        // Store the request promise
        getWalletsRequestRef.current = requestPromise;
        return requestPromise;
    }, []);

    const flagWallet = useCallback(async (walletAddress: string, isFlagged: boolean): Promise<Wallet | null> => {
        setState(prev => ({ ...prev, updateWallet: { ...prev.updateWallet, loading: true, error: null } }));

        try {
            const token = getCookie("token");

            const response = await fetch('/api/flag-wallet', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    wallet_address: walletAddress,
                    suspicious_illegal_activity: isFlagged
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to flag wallet');
            }

            setState(prev => ({ ...prev, updateWallet: { data, error: null, loading: false } }));
            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setState(prev => ({
                ...prev,
                updateWallet: { data: null, error: errorMessage, loading: false }
            }));
            return null;
        }
    }, []);

    // Cleanup function to abort any ongoing requests
    const cleanup = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        getWalletsRequestRef.current = null;
        abortControllerRef.current = null;
    }, []);

    return {
        addWalletStatus: state.addWallet,
        getWalletsStatus: state.getWallets,
        updateWalletStatus: state.updateWallet,
        deleteWalletStatus: state.deleteWallet,
        addWallet,
        getWallets,
        flagWallet,
        cleanup,
        // TODO: Add other functions here
    };
}