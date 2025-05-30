import { create } from 'zustand';
import { getCookie } from "cookies-next";

// Define types for our store
interface FlaggedItem {
  id: string;
  type: 'wallet' | 'transaction';
  data: {
    address?: string;
    txid?: string;
    reason?: string;
    timestamp: number;
  };
}

interface WalletState {
  // Wallet flags
  flaggedWallets: Map<string, boolean>;
  flagLoading: boolean;
  
  // Saved wallets
  savedWallets: Set<string>;
  saveLoading: boolean;
  
  // Related wallets
  relatedWallets: Map<string, Set<string>>;
  
  // Flagged items (both wallets and transactions)
  flaggedItems: FlaggedItem[];
  flaggedItemsLoading: boolean;
  
  // Actions
  checkWalletFlag: (address: string) => Promise<boolean>;
  flagWallet: (address: string, reason?: string) => Promise<void>;
  unflagWallet: (address: string) => Promise<void>;
  
  checkWalletSaved: (address: string) => Promise<boolean>;
  saveWallet: (address: string) => Promise<void>;
  unsaveWallet: (address: string) => Promise<void>;
  
  fetchRelatedWallets: (address: string) => Promise<Set<string>>;
  
  fetchFlaggedItems: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  flaggedWallets: new Map(),
  flagLoading: false,
  
  savedWallets: new Set(),
  saveLoading: false,
  
  relatedWallets: new Map(),
  
  flaggedItems: [],
  flaggedItemsLoading: false,
  
  // Actions
  checkWalletFlag: async (address) => {
    try {
      // Check if we already have this wallet's flag status cached
      if (get().flaggedWallets.has(address)) {
        return get().flaggedWallets.get(address) || false;
      }
      
      set({ flagLoading: true });
      const token = getCookie("token") || localStorage.getItem("token");
      
      const response = await fetch(`/api/check-flag?address=${address}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error("Failed to check wallet flag status");
      }
      
      const data = await response.json();
      const isFlagged = data.flagged || false;
      
      // Update the cache
      set((state) => ({
        flaggedWallets: new Map(state.flaggedWallets).set(address, isFlagged)
      }));
      
      return isFlagged;
    } catch (error) {
      console.error("Error checking wallet flag:", error);
      return false;
    } finally {
      set({ flagLoading: false });
    }
  },
  
  flagWallet: async (address, reason) => {
    try {
      set({ flagLoading: true });
      const token = getCookie("token") || localStorage.getItem("token");
      
      const response = await fetch(`/api/flag-wallet`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ address, reason }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to flag wallet");
      }
      
      // Update the cache
      set((state) => ({
        flaggedWallets: new Map(state.flaggedWallets).set(address, true)
      }));
      
      // Refresh flagged items
      await get().fetchFlaggedItems();
    } catch (error) {
      console.error("Error flagging wallet:", error);
    } finally {
      set({ flagLoading: false });
    }
  },
  
  unflagWallet: async (address) => {
    try {
      set({ flagLoading: true });
      const token = getCookie("token") || localStorage.getItem("token");
      
      const response = await fetch(`/api/unflag-wallet`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to unflag wallet");
      }
      
      // Update the cache
      set((state) => ({
        flaggedWallets: new Map(state.flaggedWallets).set(address, false)
      }));
      
      // Refresh flagged items
      await get().fetchFlaggedItems();
    } catch (error) {
      console.error("Error unflagging wallet:", error);
    } finally {
      set({ flagLoading: false });
    }
  },
  
  checkWalletSaved: async (address) => {
    try {
      // Check if we already have this wallet's saved status cached
      if (get().savedWallets.has(address)) {
        return true;
      }
      
      set({ saveLoading: true });
      const token = getCookie("token") || localStorage.getItem("token");
      
      const response = await fetch(`/api/check-saved?address=${address}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error("Failed to check if wallet is saved");
      }
      
      const data = await response.json();
      const isSaved = data.saved || false;
      
      // Update the cache
      if (isSaved) {
        set((state) => ({
          savedWallets: new Set(state.savedWallets).add(address)
        }));
      }
      
      return isSaved;
    } catch (error) {
      console.error("Error checking if wallet is saved:", error);
      return false;
    } finally {
      set({ saveLoading: false });
    }
  },
  
  saveWallet: async (address) => {
    try {
      set({ saveLoading: true });
      const token = getCookie("token") || localStorage.getItem("token");
      
      const response = await fetch(`/api/save-wallet`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save wallet");
      }
      
      // Update the cache
      set((state) => ({
        savedWallets: new Set(state.savedWallets).add(address)
      }));
    } catch (error) {
      console.error("Error saving wallet:", error);
    } finally {
      set({ saveLoading: false });
    }
  },
  
  unsaveWallet: async (address) => {
    try {
      set({ saveLoading: true });
      const token = getCookie("token") || localStorage.getItem("token");
      
      const response = await fetch(`/api/unsave-wallet`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to unsave wallet");
      }
      
      // Update the cache
      set((state) => {
        const newSavedWallets = new Set(state.savedWallets);
        newSavedWallets.delete(address);
        return { savedWallets: newSavedWallets };
      });
    } catch (error) {
      console.error("Error unsaving wallet:", error);
    } finally {
      set({ saveLoading: false });
    }
  },
  
  fetchRelatedWallets: async (address) => {
    try {
      // Check if we already have related wallets for this address
      if (get().relatedWallets.has(address)) {
        return get().relatedWallets.get(address) || new Set();
      }
      
      const token = getCookie("token") || localStorage.getItem("token");
      
      const response = await fetch(`/api/related-wallets?address=${address}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch related wallets");
      }
      
      const data = await response.json();
      const relatedAddresses: Set<string> = new Set(
          (data.related_addresses || []).map((addr: unknown) => String(addr))
      );
      
      // Update the cache
      set((state) => ({
        relatedWallets: new Map(state.relatedWallets).set(address, relatedAddresses)
      }));
      
      return relatedAddresses;
    } catch (error) {
      console.error("Error fetching related wallets:", error);
      return new Set();
    }
  },
  
  fetchFlaggedItems: async () => {
    try {
      set({ flaggedItemsLoading: true });
      const token = getCookie("token") || localStorage.getItem("token");
      
      const response = await fetch(`/api/flagged-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch flagged items");
      }
      
      const data = await response.json();
      set({ flaggedItems: data.items || [] });
      
      // Update the flagged wallets cache
      const flaggedWallets = new Map();
      data.items.forEach((item: FlaggedItem) => {
        if (item.type === 'wallet' && item.data.address) {
          flaggedWallets.set(item.data.address, true);
        }
      });
      
      set((state) => ({
        flaggedWallets: new Map([...state.flaggedWallets, ...flaggedWallets])
      }));
    } catch (error) {
      console.error("Error fetching flagged items:", error);
    } finally {
      set({ flaggedItemsLoading: false });
    }
  },
}));