from flask import Blueprint, jsonify
from extensions import db
from models import Account, AccountType, Transaction, Investment, Category
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@dashboard_bp.route('/', methods=['GET'])
@jwt_required()
def get_dashboard():
    user_id = get_jwt_identity()
    
    # 1. Net Worth (Total Assets + Total Cash - Total Debt)
    accounts = Account.query.filter_by(user_id=user_id).all()
    
    total_liquidity = 0
    total_debt = 0
    total_invested_cash = 0 # Cash in investment accounts
    
    for acc in accounts:
        if acc.type == AccountType.CREDIT:
            total_debt += abs(acc.balance if acc.balance < 0 else 0) # usually negative
        elif acc.type == AccountType.INVESTMENT:
            total_invested_cash += acc.balance
        else:
            total_liquidity += acc.balance
            
    # Investment Holdings Value
    investments = Investment.query.join(Account).filter(Account.user_id == user_id).all()
    portfolio_value = 0
    total_invested_cost = 0
    
    for inv in investments:
        # Use last price or avg buy if no history
        price = inv.price_history[-1].price if inv.price_history else inv.avg_buy_price
        val = inv.quantity * price
        portfolio_value += val
        total_invested_cost += inv.quantity * inv.avg_buy_price

    net_worth = total_liquidity + total_invested_cash + portfolio_value - total_debt
    
    # 2. Debt Status (Utilization)
    debt_details = []
    for acc in accounts:
        if acc.type == AccountType.CREDIT and acc.credit_card:
            limit = acc.credit_card.credit_limit
            # Balance is negative for debt.
            current_debt = abs(acc.balance)
            utilization = (current_debt / limit) * 100 if limit > 0 else 0
            debt_details.append({
                "name": acc.name,
                "current_debt": current_debt,
                "limit": limit,
                "utilization": utilization,
                "due_date": acc.credit_card.payment_due_day
            })

    # 3. Cashflow (Last 6 Months)
    # Group transactions by month
    today = datetime.utcnow()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # 3. Cashflow (Last 6 Months)
    six_months_ago = today - timedelta(days=180)
    
    txs = Transaction.query.join(Account).filter(
        Account.user_id == user_id, 
        Transaction.date >= six_months_ago,
        Transaction.parent_id == None 
    ).order_by(Transaction.date.desc()).all()
    
    cashflow = {} 
    
    # Track current month stats for Savings Rate
    current_month_income = 0
    current_month_expense = 0
    
    # Track expenses by category for Top Expenses (Current Month)
    expenses_by_category = {} 
    
    for tx in txs:
        if tx.transfer_id:
            continue
            
        # Cashflow aggregation
        month_key = tx.date.strftime("%Y-%m")
        if month_key not in cashflow:
            cashflow[month_key] = {"income": 0, "expense": 0}
            
        if tx.amount > 0:
            cashflow[month_key]["income"] += tx.amount
        else:
            cashflow[month_key]["expense"] += abs(tx.amount)
            
        # Current Month Stats
        if tx.date >= month_start:
            if tx.amount > 0:
                current_month_income += tx.amount
            else:
                abs_amount = abs(tx.amount)
                current_month_expense += abs_amount
                cat_name = tx.category.name if tx.category else "Uncategorized"
                expenses_by_category[cat_name] = expenses_by_category.get(cat_name, 0) + abs_amount

    # Savings Rate
    savings_rate = 0
    if current_month_income > 0:
        savings_rate = ((current_month_income - current_month_expense) / current_month_income) * 100
        
    # Top Expenses
    top_expenses = sorted(expenses_by_category.items(), key=lambda x: x[1], reverse=True)[:5]
    top_expenses_list = [{"category": k, "amount": v} for k, v in top_expenses]

    # Budget Status (Mock or Basic Implementation)
    # Fetch active budgets for this user
    # Assuming monthly budgets for simplicity
    from models import Budget
    budgets = Budget.query.filter_by(user_id=user_id).all()
    budget_status = []
    
    for b in budgets:
        # Calculate actual spending for this category in current month
        # We can reuse expenses_by_category if category names match, but safer to use IDs if possible.
        # However, expenses_by_category uses names. Let's start with names or re-query if needed. 
        # Ideally we'd aggregate by ID above. For now, let's stick to simple logic.
        
        # Re-calc actuals by category ID for accuracy
        actual = 0
        # Optimization: pre-calculate map of category_id -> amount for current month
        # (Doing it linear here for simplicity as N is small)
        for tx in txs:
            if tx.date >= month_start and tx.amount < 0 and tx.category_id == b.category_id and not tx.transfer_id:
               actual += abs(tx.amount)
               
        budget_status.append({
            "category": b.category.name if b.category else "Unknown",
            "limit": b.amount,
            "actual": actual,
            "utilization": (actual / b.amount) * 100 if b.amount > 0 else 0
        })

    # Sort cashflow list
    cashflow_list = [{"month": k, **v} for k, v in sorted(cashflow.items())]

    return jsonify({
        "metrics": {
            "net_worth": net_worth,
            "liquidity": total_liquidity,
            "total_debt": total_debt,
            "portfolio_value": portfolio_value,
            "total_invested_cost": total_invested_cost,
            "unrealized_profit": portfolio_value - total_invested_cost,
            "savings_rate": savings_rate, 
            "monthly_income": current_month_income,
            "monthly_expense": current_month_expense
        },
        "debt_status": debt_details,
        "cashflow_history": cashflow_list,
        "top_expenses": top_expenses_list,
        "budget_status": budget_status,
        "recent_transactions": [{
            "id": t.id,
            "date": t.date.isoformat(),
            "description": t.description,
            "amount": t.amount,
            "category": t.category.name if t.category else "Uncategorized",
            "category_id": t.category_id,
            "account": t.account.name,
            "account_id": t.account_id,
            "type": "income" if t.amount > 0 else "expense"
        } for t in txs[:10]] 
    }), 200
