# Zustand Conversion Todo List

This document lists components that can be converted to use Zustand state management. Check off items as they are completed.

## High Priority Components

### WalletInfo Component
- [ ] Convert local state for flagged status to use `useWalletStore`
- [ ] Convert related wallets state to use `useWalletStore`
- [ ] Benefit: Centralized wallet flagging logic and related wallet data that can be shared across components

### SaveWalletButton Component
- [ ] Convert local state for saved status to use `useWalletStore`
- [ ] Benefit: Consistent saved wallet state across the application

### FlaggedItemsSidebar Component
- [ ] Convert mock implementation to use `useWalletStore.flaggedItems`
- [ ] Benefit: Real-time updates when items are flagged/unflagged anywhere in the app

### WalletActivityHeatmap Component
- [ ] Convert year selection state to use a new `useWalletActivityStore`
- [ ] Benefit: Persistent year selection across component remounts

## Medium Priority Components

### TransactionDetails Component
- [ ] Convert any local state to use `useTransactionStore`
- [ ] Benefit: Consistent transaction data display across the application

### WalletTransactionsDisplay Component
- [ ] Convert pagination/filtering state to use `useWalletStore`
- [ ] Benefit: Persistent pagination and filter settings

### RecentSearches Component
- [ ] Create a new `useSearchHistoryStore` for managing search history
- [ ] Benefit: Centralized search history management accessible from anywhere

### BitcoinPrevTxChart Component
- [ ] Convert chart configuration state to use `useTransactionStore`
- [ ] Benefit: Persistent chart settings

## Low Priority Components

### DarkModeToggle Component
- [ ] Convert theme state to use a new `useThemeStore` (if not already using next-themes)
- [ ] Benefit: Centralized theme management

### CoinAge Component
- [ ] Convert any local visualization state to use `useForensicsStore`
- [ ] Benefit: Persistent visualization settings

### WalletGraph Component
- [ ] Convert graph visualization state to use `useWalletStore`
- [ ] Benefit: Consistent graph visualization across the application

## Application-wide Features

### Authentication
- [ ] Create a new `useAuthStore` for managing authentication state
- [ ] Benefit: Centralized authentication logic accessible from anywhere

### Error Handling
- [ ] Create a new `useErrorStore` for managing global error state
- [ ] Benefit: Consistent error handling and display across the application

### API Request Caching
- [ ] Implement request caching in existing stores
- [ ] Benefit: Improved performance by avoiding redundant API calls

## Best Practices for Conversion

1. Start with one component at a time
2. Create or update the appropriate store
3. Replace local state with store state
4. Test thoroughly to ensure functionality is maintained
5. Update documentation in zustand-guide.md