import { create } from 'zustand';
import { getCookie } from "cookies-next";
import type { CoinAgeData } from "@/types/coinAgeData.types";
import type { RelatedTransactionsProps } from "@/components/RelatedTransactions/relatedTransactions.types";
import type { TransactionDetailsProps } from "@/types/transactions.types";
import type { WalletAddressFromTxId } from "@/components/WalletAddressFromTxId/walletAddressFromTxId.types";
import type { WalletData } from "@/types/wallet.types";

interface ForensicsState {
  // Input state
  input: string;
  isTxid: boolean;
  
  // Transaction data
  coinAgeData: CoinAgeData | null;
  relatedTxData: RelatedTransactionsProps | null;
  transaction: TransactionDetailsProps | undefined;
  mempoolTx: TransactionDetailsProps | undefined;
  wallet: WalletAddressFromTxId | undefined;
  
  // Wallet data
  walletData: WalletData | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  walletLoading: boolean;
  walletError: string | null;
  
  // Actions
  setInput: (input: string) => void;
  setIsTxid: (isTxid: boolean) => void;
  fetchTxInsights: (type: "coinAge" | "relatedTx" | "transaction" | "wallet" | "mempool") => Promise<void>;
  fetchWalletInsights: (type: "wallet" | "wallettx") => Promise<void>;
  reset: () => void;
}

export const useForensicsStore = create<ForensicsState>((set, get) => ({
  // Initial state
  input: "",
  isTxid: false,
  coinAgeData: null,
  relatedTxData: null,
  transaction: undefined,
  mempoolTx: undefined,
  wallet: undefined,
  walletData: null,
  loading: false,
  error: null,
  walletLoading: false,
  walletError: null,
  
  // Actions
  setInput: (input) => set({ input }),
  setIsTxid: (isTxid) => set({ isTxid }),
  
  fetchTxInsights: async (type) => {
    const { input, isTxid } = get();
    if (!input || !isTxid) return;

    set({ loading: true, error: null });

    try {
      const token = getCookie("token") || localStorage.getItem("token");
      let response: Response;

      switch (type) {
        case "coinAge":
          response = await fetch(`/api/coin-age?hashid=${input}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to fetch coin age data");
          set({ coinAgeData: await response.json() });
          break;

        case "relatedTx":
          response = await fetch(`/api/related-tx?txid=${input}&depth=5`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to fetch related transaction data");
          set({ relatedTxData: await response.json() });
          break;

        case "transaction":
          response = await fetch(`/api/tx-info?txid=${input}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to fetch transaction data");
          set({ transaction: await response.json() });
          break;

        case "wallet":
          response = await fetch(`/api/wallet-from-txid?txid=${input}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to fetch wallet from txid");
          set({ wallet: await response.json() });
          break;

        case "mempool":
          response = await fetch(`/api/mempool-tx?txid=${input}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to fetch mempool transaction");
          set({ mempoolTx: await response.json() });
          break;

        default:
          throw new Error("Invalid fetch type");
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchWalletInsights: async (type) => {
    const { input, isTxid } = get();
    if (!input) return;

    // Only proceed if isTxid is false (meaning it's a wallet address)
    if (isTxid) return;

    set({ walletLoading: true, walletError: null });

    try {
      const token = getCookie("token") || localStorage.getItem("token");

      switch (type) {
        case "wallet":
          const walletResponse = await fetch(`/api/wallet?address=${input}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!walletResponse.ok) {
            const errorData = await walletResponse.json();
            throw new Error(errorData.detail || "Failed to fetch wallet data");
          }

          const data = await walletResponse.json();
          set({ walletData: data });
          break;
      }
    } catch (err) {
      console.error("Error in fetchWalletInsights:", err);
      set({ walletError: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      set({ walletLoading: false });
    }
  },
  
  reset: () => set({
    coinAgeData: null,
    relatedTxData: null,
    transaction: undefined,
    mempoolTx: undefined,
    wallet: undefined,
    walletData: null,
    loading: false,
    error: null,
    walletLoading: false,
    walletError: null,
  }),
}));