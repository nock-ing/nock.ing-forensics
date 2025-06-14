"use client";
import { useTransactionApi } from "@/hooks/useTransactionApi";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { CreateTransactionRequest } from "@/types/savedTransaction.types";

interface SaveTransactionButtonProps {
    transactionData: {
        txid: string;
        amount?: number;
        fee?: number;
        timestamp?: number;
        block_height?: number;
        total_input?: number;
        total_output?: number;
    };
}

export default function SaveTransactionButton({ transactionData }: SaveTransactionButtonProps) {
    const { createTransaction, getTransaction, createTransactionStatus: { loading } } = useTransactionApi();
    const [isSaved, setIsSaved] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [hasChecked, setHasChecked] = useState(false);

    // Check if transaction already exists
    useEffect(() => {
        // Only check once when component mounts or txid changes
        if (hasChecked) return;

        let isMounted = true;

        const checkIfTransactionExists = async () => {
            if (!isMounted) return;

            try {
                setIsChecking(true);
                const existingTransaction = await getTransaction(transactionData.txid);

                if (!isMounted) return;

                setIsSaved(!!existingTransaction);
            } catch (err) {
                console.error("Error checking transaction:", err);
                // If we get an error (like 404), assume it doesn't exist
                if (isMounted) {
                    setIsSaved(false);
                }
            } finally {
                if (isMounted) {
                    setIsChecking(false);
                    setHasChecked(true);
                }
            }
        };

        checkIfTransactionExists();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [transactionData.txid]); // Remove getTransaction from dependencies

    const handleSaveTransaction = async () => {
        if (isSaved) return;

        const transactionToSave: CreateTransactionRequest = {
            transaction_hash: transactionData.txid,
            timestamp: transactionData.timestamp || Math.floor(Date.now() / 1000),
            total_input: transactionData.total_input || transactionData.amount || 0,
            total_output: transactionData.total_output || (transactionData.amount ? transactionData.amount - (transactionData.fee || 0) : 0),
            fee: transactionData.fee || 0,
            suspicious_illegal_activity: false,
            // Optional fields - you might want to set these based on your needs
            wallet_id: undefined,
            block_id: undefined,
        };

        const result = await createTransaction(transactionToSave);

        if (result) {
            setIsSaved(true);
            toast({
                title: "Transaction saved",
                description: "The transaction has been added to your database.",
            });
        } else {
            toast({
                title: "Failed to save transaction",
                description: "There was an error saving the transaction.",
                variant: "destructive",
            });
        }
    };

    return (
        <Button
            onClick={handleSaveTransaction}
            disabled={loading || isSaved || isChecking}
            variant={isSaved ? "outline" : "default"}
            className="ml-auto"
        >
            {loading ? "Saving..." :
                isChecking ? "Checking..." :
                    isSaved ? "Saved ✓" : "Save Transaction"}
        </Button>
    );
}