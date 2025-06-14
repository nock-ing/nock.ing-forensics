import {useState} from 'react';
import {getCookie} from "cookies-next";
import {SavedTransaction, CreateTransactionRequest, UpdateTransactionRequest} from '@/types/savedTransaction.types';

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

export function useTransactionApi() {
    const [state, setState] = useState<{
        getTransaction: ApiResponse<SavedTransaction>;
        updateTransaction: ApiResponse<SavedTransaction>;
        deleteTransaction: ApiResponse<boolean>;
        createTransaction: ApiResponse<SavedTransaction>;
    }>({
        getTransaction: {data: null, error: null, loading: false},
        updateTransaction: {data: null, error: null, loading: false},
        deleteTransaction: {data: null, error: null, loading: false},
        createTransaction: {data: null, error: null, loading: false},
    });

    const getTransaction = async (id: string): Promise<SavedTransaction | null> => {
        setState(prev => ({...prev, getTransaction: {...prev.getTransaction, loading: true, error: null}}));

        try {
            const token = getCookie("token");

            const response = await fetch(`/api/transactions/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific error codes
                if (response.status === 422) {
                    throw new Error('Invalid transaction ID format or transaction not found');
                }
                throw new Error(data.detail || 'Failed to get transaction');
            }

            setState(prev => ({...prev, getTransaction: {data, error: null, loading: false}}));
            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setState(prev => ({
                ...prev,
                getTransaction: {data: null, error: errorMessage, loading: false}
            }));
            return null;
        }
    };

    const createTransaction = async (transactionId: string): Promise<SavedTransaction | null> => {
        setState(prev => ({...prev, createTransaction: {...prev.createTransaction, loading: true, error: null}}));

        try {
            const token = getCookie("token");

            // Get raw transaction data
            let rawTxResponse = await fetch(`/api/tx-info?txid=${transactionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            let rawTx = await rawTxResponse.json();

            // Get wallet data from transaction
            let walletFromTxResponse = await fetch(`/api/wallet-from-txid?txid=${transactionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            let walletFromTx = await walletFromTxResponse.json();

            if (!rawTxResponse.ok || !walletFromTxResponse.ok) {
                throw new Error('Failed to get transaction info');
            }

            // Get current user ID from token or user endpoint
            let userResponse = await fetch('/api/user/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!userResponse.ok) {
                throw new Error('Failed to get user information');
            }

            const userData = await userResponse.json();
            const userId = userData.id || userData.user_id;

            // Create or get wallet
            let walletCreateResponse = await fetch('/api/wallets/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    wallet_name: walletFromTx.name ?? 'Created from transaction ' + transactionId,
                    wallet_address: walletFromTx.scriptpubkey_address,
                    wallet_type: walletFromTx.wallet_type,
                    balance: walletFromTx.balance_btc,
                    suspicious_illegal_activity: false,
                })
            });

            if (!walletCreateResponse.ok) {
                throw new Error('Failed to create wallet');
            }

            const walletData = await walletCreateResponse.json();
            const walletId = walletData.id || walletData.wallet_id;

            // Get or create block
            let blockId;
            const blockHash = rawTx.blockhash;
            
            if (blockHash) {
                // Try to get existing block first
                let blockResponse = await fetch(`/api/blocks/by-hash/${blockHash}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (blockResponse.ok) {
                    const blockData = await blockResponse.json();
                    blockId = blockData.id || blockData.block_id;
                } else {
                    // Create new block if it doesn't exist
                    let blockCreateResponse = await fetch('/api/blocks/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            block_hash: blockHash,
                            block_height: rawTx.status?.block_height,
                            block_time: rawTx.status?.block_time,
                            // Add other block fields as needed
                        })
                    });

                    if (!blockCreateResponse.ok) {
                        throw new Error('Failed to create block');
                    }

                    const newBlockData = await blockCreateResponse.json();
                    blockId = newBlockData.id || newBlockData.block_id;
                }
            } else {
                // Handle unconfirmed transactions
                blockId = null; // or handle differently based on your requirements
            }

            // Prepare transaction data with real values
            const transactionData = {
                transaction_hash: transactionId,
                wallet_id: walletId,
                block_id: blockId,
                user_id: userId,
                timestamp: rawTx.status?.block_time || Math.floor(Date.now() / 1000),
                total_input: rawTx.vin?.reduce((sum: number, input: any) => sum + (input.prevout?.value || 0), 0) || 0,
                total_output: rawTx.vout?.reduce((sum: number, output: any) => sum + (output.value || 0), 0) || 0,
                fee: rawTx.fee || 0,
                suspicious_illegal_activity: false
            };

            // Create the transaction
            const response = await fetch('/api/transactions/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(transactionData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to create transaction');
            }

            setState(prev => ({...prev, createTransaction: {data, error: null, loading: false}}));
            return data;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setState(prev => ({
                ...prev,
                createTransaction: {data: null, error: errorMessage, loading: false}
            }));
            return null;
        }
    };

    const updateTransaction = async (id: string, transactionData: UpdateTransactionRequest): Promise<SavedTransaction | null> => {
        setState(prev => ({...prev, updateTransaction: {...prev.updateTransaction, loading: true, error: null}}));

        try {
            const token = getCookie("token");

            const response = await fetch(`/api/transactions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(transactionData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to update transaction');
            }

            setState(prev => ({...prev, updateTransaction: {data, error: null, loading: false}}));
            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setState(prev => ({
                ...prev,
                updateTransaction: {data: null, error: errorMessage, loading: false}
            }));
            return null;
        }
    };

    const deleteTransaction = async (id: string): Promise<boolean> => {
        setState(prev => ({...prev, deleteTransaction: {...prev.deleteTransaction, loading: true, error: null}}));

        try {
            const token = getCookie("token");

            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to delete transaction');
            }

            setState(prev => ({...prev, deleteTransaction: {data: true, error: null, loading: false}}));
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setState(prev => ({
                ...prev,
                deleteTransaction: {data: false, error: errorMessage, loading: false}
            }));
            return false;
        }
    };

    const flagTransaction = async (id: string, isFlagged: boolean): Promise<SavedTransaction | null> => {
        setState(prev => ({...prev, updateTransaction: {...prev.updateTransaction, loading: true, error: null}}));

        try {
            const token = getCookie("token");

            const response = await fetch(`/api/transactions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    suspicious_illegal_activity: isFlagged
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to flag transaction');
            }

            setState(prev => ({...prev, updateTransaction: {data, error: null, loading: false}}));
            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setState(prev => ({
                ...prev,
                updateTransaction: {data: null, error: errorMessage, loading: false}
            }));
            return null;
        }
    };

    return {
        getTransactionStatus: state.getTransaction,
        updateTransactionStatus: state.updateTransaction,
        deleteTransactionStatus: state.deleteTransaction,
        createTransactionStatus: state.createTransaction,
        getTransaction,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        flagTransaction,
    };
}