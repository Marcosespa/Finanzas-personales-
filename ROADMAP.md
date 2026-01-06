# Project Roadmap & Future Ideas

## Current Status
- [x] Core Banking (Accounts, Transactions, Transfers)
- [x] Credit Card Management (Limits, Payments)
- [x] Investment Portfolio (Stocks, Crypto tracking)
- [x] Basic Dashboard & Analytics
- [x] Responsive Web UI

## Short-term Improvements (v1.1)
1. **Budget UI**: The backend supports Budgets and Rules. Need to build the Frontend UI to set monthly limits per category and visualize progress.
2. **Transaction Splitting UI**: Backend supports it, but Frontend needs a "Split" button in the Transaction Modal to divide one expense into multiple categories.
3. **Recurring Transactions**: UI to set up automatic monthly bills (rent, subscriptions).

## Mid-term Goals (v2.0)
1. **Multi-Currency**: Fully leverage the `ExchangeRate` model to show total Net Worth in a base currency (e.g., USD) even if accounts are in COP/EUR.
2. **Reports Page**: Detailed PDF exports and advanced filtering (e.g., "How much did I spend on Food last year?").
3. **Import/Export**: CSV import for bank statements.

## Long-term Vision (v3.0)
1. **Bank Integration**: Use APIs like Plaid or Fintoc to auto-sync transactions from real banks.
2. **AI Insights**: Use an LLM to analyze spending habits and suggest savings strategies (e.g., "You spend 20% more on weekends").
3. **Mobile App**: Wrap the React app in Capacitor or build a native React Native version.

## Technical Debt / Maintenance
- Add Unit Tests for Frontend components (Vitest).
- Setup CI/CD pipeline (GitHub Actions).
- Switch database to PostgreSQL for production.
