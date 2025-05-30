# Zustand State Management Guide

## What is Zustand?

Zustand is a small, fast, and scalable state management solution for React applications. It uses a simple and intuitive API to create and manage global state without the boilerplate code typically associated with other state management libraries.

## Why Zustand over React Context?

While React Context is a built-in solution for sharing state between components, Zustand offers several advantages:

1. **Performance**: Zustand only re-renders components that actually use the specific state that changed, while Context re-renders all components that use the context, even if they don't use the specific state that changed.

2. **Simplicity**: Zustand has a simpler API with less boilerplate compared to Context + useReducer.

3. **Devtools Integration**: Zustand has built-in support for Redux DevTools, making debugging easier.

4. **Middleware Support**: Zustand supports middleware for extending functionality (persistence, immer, etc.).

5. **No Provider Nesting**: Unlike Context, Zustand doesn't require wrapping components in providers, avoiding the "provider hell" problem.

## When to Use Zustand vs. Context

- **Use Zustand** for:
  - Global application state
  - State that needs to be accessed by many components
  - Performance-critical state updates
  - Complex state logic

- **Use Context** for:
  - Theme/localization
  - Authentication state
  - Simple shared state with infrequent updates
  - When you want to avoid adding dependencies

## How to Use Zustand in This Project

### 1. Creating a Store

We've implemented a transaction store in `/store/useTransactionStore.ts`:

```typescript
import { create } from 'zustand';

interface MyState {
  // State properties
  count: number;

  // Actions
  increment: () => void;
  decrement: () => void;
}

export const useMyStore = create<MyState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

### 2. Using the Store in Components

```tsx
import { useMyStore } from '@/store/useMyStore';

function Counter() {
  // Only subscribe to the specific state/actions you need
  const { count, increment } = useMyStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### 3. Accessing Store Outside React Components

```typescript
import { useMyStore } from '@/store/useMyStore';

// Get the current state
const currentCount = useMyStore.getState().count;

// Update state
useMyStore.getState().increment();
```

## Real Examples in Our Project

### 1. Transaction Store (`useTransactionStore`)

We've implemented a transaction store that manages:

1. Transaction data (ID, related transactions)
2. UI state (selected node, panel visibility)
3. ReactFlow state (nodes, edges)

This allows components like `RelatedTxReactFlow` and `TransactionDetailsPanel` to share state without prop drilling, making the code cleaner and more maintainable.

### 2. Forensics Store (`useForensicsStore`)

The forensics store centralizes all data fetching and state management for the forensics page:

1. Transaction insights (coin age, related transactions, transaction details)
2. Wallet insights (wallet data, transactions)
3. Loading states and error handling

Example usage:

```tsx
import { useForensicsStore } from '@/store/useForensicsStore';

function ForensicsComponent() {
  const { 
    input, 
    isTxid, 
    coinAgeData, 
    loading, 
    error, 
    setInput, 
    setIsTxid, 
    fetchTxInsights 
  } = useForensicsStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsTxid(/^[0-9a-fA-F]{64}$/.test(input));
    if (isTxid) {
      fetchTxInsights("coinAge");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit">Analyze</button>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {coinAgeData && <CoinAge {...coinAgeData} />}
    </div>
  );
}
```

### 3. Wallet Store (`useWalletStore`)

The wallet store manages all wallet-related functionality:

1. Flagged wallets (check, flag, unflag)
2. Saved wallets (check, save, unsave)
3. Related wallets
4. Flagged items (both wallets and transactions)

Example usage:

```tsx
import { useWalletStore } from '@/store/useWalletStore';

function WalletComponent({ address }) {
  const { 
    flaggedWallets, 
    flagLoading, 
    checkWalletFlag, 
    flagWallet, 
    unflagWallet 
  } = useWalletStore();

  useEffect(() => {
    checkWalletFlag(address);
  }, [address, checkWalletFlag]);

  const isFlagged = flaggedWallets.get(address) || false;

  return (
    <div>
      <h2>Wallet: {address}</h2>

      <button 
        onClick={() => isFlagged ? unflagWallet(address) : flagWallet(address)}
        disabled={flagLoading}
      >
        {isFlagged ? 'Unflag Wallet' : 'Flag Wallet'}
      </button>
    </div>
  );
}
```

### Benefits in Our Implementation:

1. **Decoupled Components**: Components can now be used anywhere in the app without needing to pass props down.

2. **Centralized Logic**: Related logic is now in one place, making it easier to maintain.

3. **Reduced Prop Drilling**: No need to pass state through multiple component layers.

4. **Improved Performance**: Components only re-render when the specific state they use changes.

5. **Caching**: Our stores implement caching to avoid unnecessary API calls.

## Best Practices

1. **Selective Subscription**: Only subscribe to the specific state and actions you need in each component.

2. **Multiple Stores**: Create separate stores for unrelated parts of your application.

3. **TypeScript**: Always use TypeScript for better type safety and autocompletion.

4. **Middleware**: Consider using middleware for common patterns like persistence or immer for immutable updates.

5. **Testing**: Stores can be easily tested in isolation from your components.
