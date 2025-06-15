import {useState} from 'react';
import {getCookie} from "cookies-next";
import {SavedTransaction, CreateTransactionRequest, UpdateTransactionRequest} from '@/types/savedTransaction.types';
import {NextResponse} from "next/server";
import {Transaction} from "@/types/transactions.types";
import {useUser} from './use-user';

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

export function useTransactionApi() {
    const {user} = useUser();
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

    // Simplified createTransaction method that matches your working Postman request
    const createTransaction = async (transactionData: CreateTransactionRequest): Promise<SavedTransaction | null> => {
        setState(prev => ({...prev, createTransaction: {...prev.createTransaction, loading: true, error: null}}));

        try {
            const token = getCookie("token");

            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            // Prepare the request data to match your working Postman request
            const requestData = {
                transaction_hash: transactionData.transaction_hash,
                wallet_id: transactionData.wallet_id || 1, // Default to 1 if not provided
                block_id: transactionData.block_id || 1, // Default to 1 if not provided
                user_id: user.id,
                timestamp: transactionData.timestamp,
                total_input: transactionData.total_input,
                total_output: transactionData.total_output,
                fee: transactionData.fee,
                suspicious_illegal_activity: transactionData.suspicious_illegal_activity
            };

            const response = await fetch('/api/transactions/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestData),
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