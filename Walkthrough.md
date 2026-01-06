ManejadorFinanzas - Walkthrough
This document guides you through setting up, running, and using the ManejadorFinanzas application.

Prerequisites
Python 3.8+
Node.js 16+ & npm
1. Backend Setup
The backend handles the database, authentication, and financial logic.

Navigate to the backend directory:

cd backend
Activate the virtual environment (if not already active):

# Mac/Linux
source venv/bin/activate
# Windows
# venv\Scripts\activate
Install dependencies:

pip install -r requirements.txt
Initialize the Database:

export FLASK_APP=app.py
flask db upgrade
Run the Server:

flask run
The backend will start at http://127.0.0.1:5000

2. Frontend Setup
The frontend provides the responsive user interface.

Open a new terminal and navigate to the frontend directory:

cd frontend
Install dependencies:

npm install
Run the Development Server:

npm run dev
The frontend will generally start at http://localhost:5173

3. Application Tour
Open your browser to the frontend URL (e.g., http://localhost:5173).

A. Authentication
Register: Click "Register" and create a new account (e.g., user1, 
password
).
Login: Log in with your new credentials.
B. Dashboard
Upon login, you will see the Dashboard.
It displays your Net Worth, Liability, and Cashflow.
Charts will populate as you add data.
C. managing Accounts
Go to the Accounts page.
Click Add Account.
Create a Bank Account (e.g., "Main Debit", Balance: 1000).
Create a Credit Card (e.g., "Visa Gold", Limit: 5000).
Note the specific fields for Credit Cards like Billing Day.
D. Recording Transactions
Go back to the Dashboard.
Click Add Transaction.
Select an account (e.g., "Main Debit") and add an Expense (e.g., "Lunch", $20).
See your Balance update in the Accounts page and your Net Worth decrease on the Dashboard.
E. Investments
Create an Investment Account via the Accounts page.
Go to the Investments page.
Click Record Trade.
Buy a stock (e.g., Symbol: AAPL, Qty: 10, Price: 150).
View your portfolio table updating with the current value.
4. Responsive Design
Resize your browser window or open dev tools (F12) to toggle Mobile View.
The Sidebar becomes a hamburger menu.
Grids (Dashboard cards, Account lists) adjust from 4 columns to 1 column.
Tables become scrollable horizontally on small screens.