# Backend Documentation - ManejadorFinanzas

## Overview
The backend is built with **Flask** (Python) and uses **SQLAlchemy** for ORM. It follows a Service-Repository pattern (though simplified, services handle business logic).

## Key Technologies
- **Framework**: Flask
- **Database**: SQLite (dev) / PostgreSQL (prod ready)
- **ORM**: SQLAlchemy
- **Migrations**: Flask-Migrate (Alembic)
- **Auth**: Flask-JWT-Extended
- **Validation**: Marshmallow
- **Rate Limiting**: Flask-Limiter

## Architecture

### 1. Models (`models.py`)
All entities inherit from `BaseModel` which provides `created_at`, `updated_at`, and `deleted_at` (Soft Delete).
- **User**: Authentication & ownership.
- **Account**: Core entity. Types: Bank, Cash, Credit, Investment.
- **CreditCard**: 1-to-1 extension of Account. Tracks limit, dates, interest.
- **Transaction**: Ledger entry. Supports Splits via self-referential `parent_id`.
- **Transfer**: Abstraction for internal movements. Creates two Transactions (Withdrawal + Deposit).
- **Investment**: Portfolio asset. Tracks avg buy price and quantity.

### 2. Services (`services/`)
Business logic is encapsulated here, not in routes.
- **TransactionService**: Handles creation, balance updates, and splitting logic.
- **TransferService**: Manages transfers. Crucial logic: **Paying a Credit Card is a Transfer** (Debit -> Credit Account).
- **InvestmentService**: Handles Buy/Sell logic, calculating Weighted Average Price (FIFO/Avg) and Realized Profit.

### 3. API (`api/`)
Blueprints that expose RESTful endpoints.
- `/auth`: Login, Register, Refresh.
- `/accounts`: CRUD.
- `/transactions`: Ledger operations.
- `/dashboard`: Aggregated KPIs (Net Worth, Cashflow).

## Authentication Flow
1. User POSTs credentials to `/auth/login`.
2. Backend returns `access_token` (short lived) and `refresh_token`.
3. Frontend uses `access_token` in `Authorization: Bearer <token>` header.
4. Protected routes require valid token.

## Running
```bash
flask run
```
