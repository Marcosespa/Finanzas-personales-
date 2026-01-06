# Frontend Documentation - ManejadorFinanzas

## Overview
The frontend is a **React** application built with **Vite**. It focuses on performance, responsiveness, and a custom "Premium" aesthetic using Vanilla CSS variables instead of heavy UI frameworks.

## Key Technologies
- **Build Tool**: Vite
- **Framework**: React 18
- **Routing**: React Router DOM 6
- **State**: React Context (AuthContext)
- **Charts**: Recharts
- **Styling**: Vanilla CSS (CSS Variables for theming)

## Directory Structure
- `src/components`: Reusable UI (Layout, Modal, StatCard).
- `src/context`: Global state providers (Auth).
- `src/pages`: Main views (Dashboard, Accounts, Investments).
- `src/services`: API adapters (`api.js`).
- `src/styles`: Global CSS and Design System (`index.css`).

## Core Concepts

### 1. Design System
We use CSS variables in `index.css` to define:
- Colors: `--bg-primary`, `--accent-primary`, etc.
- Spacing: `--spacing-md`, `--radius-lg`.
- Transitions: `--transition-fast`.
This allows easy Dark Mode implementation (default is Dark).

### 2. Authentication Handling
- `AuthContext.jsx` manages `user` and `token`.
- `api.js` is an Axios-like wrapper (using fetch) that automatically injects the `Authorization` header.
- **Protected Routes**: Wraps the App to redirect unauthenticated users to Login.

### 3. Dashboard Logic
- Fetches aggregated data from `/dashboard`.
- Renders `StatCard` for KPIs (Net Worth, Debt).
- Renders `Recharts` for Cashflow history.
- Handles error states gracefully.

### 4. Responsive Layout
- **Sidebar**: Fixed on Desktop, Collapsible/Overlay on Mobile.
- **Grid**: Uses `grid-template-columns: repeat(auto-fit, minmax(...))` for responsive cards.

## Running
```bash
npm run dev
```
