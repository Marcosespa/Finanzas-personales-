from flask import Blueprint, request, jsonify
from extensions import db, jwt, limiter
from models import Account, CreditCard, AccountType, User
from flask_jwt_extended import jwt_required, get_jwt_identity

accounts_bp = Blueprint('accounts', __name__, url_prefix='/accounts')

@accounts_bp.route('/', methods=['GET'])
@jwt_required()
def get_accounts():
    user_id = get_jwt_identity()
    accounts = Account.query.filter_by(user_id=user_id).all()
    
    result = []
    for acc in accounts:
        acc_data = {
            "id": acc.id,
            "name": acc.name,
            "type": acc.type.value,
            "institution": acc.institution,
            "currency_code": acc.currency_code,
            "balance": acc.balance,
            "created_at": acc.created_at
        }
        
        if acc.type == AccountType.CREDIT and acc.credit_card:
            acc_data["credit_card"] = {
                "credit_limit": acc.credit_card.credit_limit,
                "billing_day": acc.credit_card.billing_day,
                "payment_due_day": acc.credit_card.payment_due_day,
                "interest_rate": acc.credit_card.interest_rate
            }
            
        result.append(acc_data)

    return jsonify(result), 200

@accounts_bp.route('/', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute") 
def create_account():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    name = data.get('name')
    type_str = data.get('type')
    institution = data.get('institution')
    currency_code = data.get('currency_code', 'COP')
    
    if not name or not type_str:
        return jsonify({"msg": "Missing required fields (name, type)"}), 400

    try:
        acc_type = AccountType(type_str)
    except ValueError:
        return jsonify({"msg": "Invalid account type"}), 400

    new_account = Account(
        user_id=user_id,
        name=name,
        type=acc_type,
        institution=institution,
        currency_code=currency_code,
        balance=data.get('balance', 0.0) # Initial balance
    )

    # Handle Credit Card specific fields
    if acc_type == AccountType.CREDIT:
        cc_data = data.get('credit_card')
        if not cc_data:
             return jsonify({"msg": "Credit Card details required for Credit account"}), 400
        
        new_cc = CreditCard(
            account=new_account,
            credit_limit=cc_data.get('credit_limit', 0),
            billing_day=cc_data.get('billing_day', 1),
            payment_due_day=cc_data.get('payment_due_day', 15),
            interest_rate=cc_data.get('interest_rate', 0.0)
        )
        db.session.add(new_cc)

    db.session.add(new_account)
    db.session.commit()

    return jsonify({"msg": "Account created", "id": new_account.id}), 201

@accounts_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_account_detail(id):
    user_id = get_jwt_identity()
    account = Account.query.filter_by(id=id, user_id=user_id).first()
    
    if not account:
        return jsonify({"msg": "Account not found"}), 404

    acc_data = {
            "id": account.id,
            "name": account.name,
            "type": account.type.value,
            "institution": account.institution,
            "currency_code": account.currency_code,
            "balance": account.balance,
            "created_at": account.created_at
    }

    if account.type == AccountType.CREDIT and account.credit_card:
             acc_data["credit_card"] = {
                "credit_limit": account.credit_card.credit_limit,
                "billing_day": account.credit_card.billing_day,
                "payment_due_day": account.credit_card.payment_due_day,
                "interest_rate": account.credit_card.interest_rate
            }

    return jsonify(acc_data), 200

@accounts_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_account(id):
    user_id = get_jwt_identity()
    account = Account.query.filter_by(id=id, user_id=user_id).first()
    
    if not account:
        return jsonify({"msg": "Account not found"}), 404
        
    data = request.get_json()
    account.name = data.get('name', account.name)
    account.institution = data.get('institution', account.institution)
    
    # We do usually NOT update type or currency as it breaks history, but simpler here.
    
    if account.type == AccountType.CREDIT and 'credit_card' in data:
         cc_data = data['credit_card']
         if account.credit_card:
            account.credit_card.credit_limit = cc_data.get('credit_limit', account.credit_card.credit_limit)
            account.credit_card.billing_day = cc_data.get('billing_day', account.credit_card.billing_day)
            account.credit_card.payment_due_day= cc_data.get('payment_due_day', account.credit_card.payment_due_day)
            account.credit_card.interest_rate = cc_data.get('interest_rate', account.credit_card.interest_rate)

    db.session.commit()
    return jsonify({"msg": "Account updated"}), 200

@accounts_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_account(id):
    user_id = get_jwt_identity()
    account = Account.query.filter_by(id=id, user_id=user_id).first()
    
    if not account:
        return jsonify({"msg": "Account not found"}), 404

    # Soft delete would be better as per plan (deleted_at), let's implement soft delete logic?
    # The models have deleted_at.
    from datetime import datetime
    account.deleted_at = datetime.utcnow()
    
    # db.session.delete(account) # Hard delete
    db.session.commit()
    
    return jsonify({"msg": "Account deleted"}), 200


@accounts_bp.route('/<int:id>/transactions', methods=['GET'])
@jwt_required()
def get_account_transactions(id):
    """
    Get all transactions for a specific account with filters.
    Query params:
        - start_date: ISO date string (e.g., 2026-01-01)
        - end_date: ISO date string
        - category_id: Filter by category
        - type: 'income' or 'expense'
        - limit: Number of results (default 100)
        - offset: Pagination offset
    """
    from datetime import datetime, timedelta
    from models import Transaction, Category
    from sqlalchemy import func
    
    user_id = get_jwt_identity()
    account = Account.query.filter_by(id=id, user_id=user_id).first()
    
    if not account:
        return jsonify({"msg": "Account not found"}), 404
    
    # Parse query params
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category_id = request.args.get('category_id')
    tx_type = request.args.get('type')  # income, expense
    limit = int(request.args.get('limit', 100))
    offset = int(request.args.get('offset', 0))
    
    # Build query
    query = Transaction.query.filter(
        Transaction.account_id == id,
        Transaction.parent_id.is_(None),  # Only main transactions
        Transaction.transfer_id.is_(None)  # Exclude transfers
    )
    
    # Apply filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Transaction.date >= start_dt)
        except:
            pass
            
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            # Add 1 day to include the end date
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
            query = query.filter(Transaction.date <= end_dt)
        except:
            pass
            
    if category_id:
        query = query.filter(Transaction.category_id == int(category_id))
        
    if tx_type == 'income':
        query = query.filter(Transaction.amount > 0)
    elif tx_type == 'expense':
        query = query.filter(Transaction.amount < 0)
    
    # Get total count before pagination
    total_count = query.count()
    
    # Order and paginate
    transactions = query.order_by(Transaction.date.desc()).offset(offset).limit(limit).all()
    
    # Calculate summary stats
    all_txs = Transaction.query.filter(
        Transaction.account_id == id,
        Transaction.parent_id.is_(None),
        Transaction.transfer_id.is_(None)
    )
    
    if start_date:
        try:
            all_txs = all_txs.filter(Transaction.date >= datetime.fromisoformat(start_date))
        except:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            all_txs = all_txs.filter(Transaction.date <= end_dt)
        except:
            pass
    
    all_txs = all_txs.all()
    
    total_income = sum(tx.amount for tx in all_txs if tx.amount > 0)
    total_expense = sum(abs(tx.amount) for tx in all_txs if tx.amount < 0)
    net_change = total_income - total_expense
    
    # Group by category for breakdown
    category_breakdown = {}
    for tx in all_txs:
        if tx.amount < 0:  # Expenses only for breakdown
            cat_name = tx.category.name if tx.category else 'Sin categoría'
            category_breakdown[cat_name] = category_breakdown.get(cat_name, 0) + abs(tx.amount)
    
    # Sort by amount descending
    category_breakdown_list = sorted(
        [{'category': k, 'amount': v} for k, v in category_breakdown.items()],
        key=lambda x: x['amount'],
        reverse=True
    )
    
    # Build response
    result = []
    for tx in transactions:
        result.append({
            "id": tx.id,
            "amount": tx.amount,
            "description": tx.description,
            "date": tx.date.isoformat(),
            "category": tx.category.name if tx.category else 'Sin categoría',
            "category_id": tx.category_id,
            "type": "income" if tx.amount > 0 else "expense",
            "has_splits": len(tx.children) > 0
        })
    
    return jsonify({
        "account": {
            "id": account.id,
            "name": account.name,
            "type": account.type.value,
            "currency_code": account.currency_code,
            "current_balance": account.balance
        },
        "transactions": result,
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "net_change": net_change,
            "transaction_count": total_count,
            "category_breakdown": category_breakdown_list
        },
        "pagination": {
            "limit": limit,
            "offset": offset,
            "total": total_count,
            "has_more": offset + limit < total_count
        }
    }), 200


@accounts_bp.route('/<int:id>/summary', methods=['GET'])
@jwt_required()
def get_account_summary(id):
    """Get daily/weekly/monthly summary for an account"""
    from datetime import datetime, timedelta
    from models import Transaction
    from sqlalchemy import func, extract
    
    user_id = get_jwt_identity()
    account = Account.query.filter_by(id=id, user_id=user_id).first()
    
    if not account:
        return jsonify({"msg": "Account not found"}), 404
    
    period = request.args.get('period', 'daily')  # daily, weekly, monthly
    days = int(request.args.get('days', 30))  # Number of days to look back
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    transactions = Transaction.query.filter(
        Transaction.account_id == id,
        Transaction.date >= start_date,
        Transaction.parent_id.is_(None),
        Transaction.transfer_id.is_(None)
    ).order_by(Transaction.date).all()
    
    # Group by period
    grouped_data = {}
    
    for tx in transactions:
        if period == 'daily':
            key = tx.date.strftime('%Y-%m-%d')
        elif period == 'weekly':
            # Get Monday of the week
            monday = tx.date - timedelta(days=tx.date.weekday())
            key = monday.strftime('%Y-%m-%d')
        else:  # monthly
            key = tx.date.strftime('%Y-%m')
        
        if key not in grouped_data:
            grouped_data[key] = {'income': 0, 'expense': 0, 'transactions': 0}
        
        if tx.amount > 0:
            grouped_data[key]['income'] += tx.amount
        else:
            grouped_data[key]['expense'] += abs(tx.amount)
        grouped_data[key]['transactions'] += 1
    
    # Convert to list
    result = [
        {
            'period': k,
            'income': v['income'],
            'expense': v['expense'],
            'net': v['income'] - v['expense'],
            'transactions': v['transactions']
        }
        for k, v in sorted(grouped_data.items())
    ]
    
    return jsonify({
        "account": {
            "id": account.id,
            "name": account.name,
            "current_balance": account.balance
        },
        "period_type": period,
        "data": result
    }), 200
