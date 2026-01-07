from flask import Blueprint, request, jsonify
from extensions import db, limiter
from services.transaction_service import TransactionService
from models import Transaction
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

transactions_bp = Blueprint('transactions', __name__, url_prefix='/transactions')

@transactions_bp.route('/', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def create_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Check for split
    splits = data.get('splits')
    
    try:
        if splits:
            # Handle Split Transaction
            tx = TransactionService.create_split_transaction(
                user_id=user_id,
                main_tx_data={
                    "account_id": data.get('account_id'),
                    "amount": data.get('amount'),
                    "description": data.get('description'),
                    "date": datetime.fromisoformat(data['date']) if data.get('date') else None
                },
                splits_data=splits
            )
        else:
            # Handle Regular Transaction
            tx = TransactionService.create_transaction(
                account_id=data.get('account_id'),
                amount=data.get('amount'),
                category_id=data.get('category_id'),
                description=data.get('description'),
                date=datetime.fromisoformat(data['date']) if data.get('date') else None
            )
            db.session.commit()
            
        return jsonify({"msg": "Transaction created", "id": tx.id}), 201
        
    except ValueError as e:
        return jsonify({"msg": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error creating transaction", "error": str(e)}), 500

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    from models import Account
    
    txs = Transaction.query.join(Account).filter(Account.user_id == user_id).order_by(Transaction.date.desc()).limit(50).all()
    
    result = []
    for tx in txs:
        if tx.parent_id is None:
            result.append({
                "id": tx.id,
                "amount": tx.amount,
                "description": tx.description,
                "date": tx.date.isoformat(),
                "account_id": tx.account_id,
                "account_name": tx.account.name,
                "category_id": tx.category_id,
                "category_name": tx.category.name if tx.category else None,
                "splits_count": len(tx.children)
            })
            
    return jsonify(result), 200

@transactions_bp.route('/search', methods=['GET'])
@jwt_required()
def search_transactions():
    """Search transactions with filters"""
    user_id = get_jwt_identity()
    from models import Account, Category
    from sqlalchemy import or_
    
    # Get search params
    query_str = request.args.get('q', '').strip()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    min_amount = request.args.get('min_amount')
    max_amount = request.args.get('max_amount')
    account_id = request.args.get('account_id')
    category_id = request.args.get('category_id')
    tx_type = request.args.get('type')  # income, expense
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    
    # Build query
    query = Transaction.query.join(Account).filter(
        Account.user_id == user_id,
        Transaction.deleted_at == None,
        Transaction.parent_id == None
    )
    
    # Text search
    if query_str:
        query = query.outerjoin(Category).filter(
            or_(
                Transaction.description.ilike(f'%{query_str}%'),
                Category.name.ilike(f'%{query_str}%'),
                Account.name.ilike(f'%{query_str}%')
            )
        )
    
    # Date filters
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(Transaction.date >= start)
        except:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(Transaction.date <= end)
        except:
            pass
    
    # Amount filters
    if min_amount:
        try:
            min_val = float(min_amount)
            query = query.filter(
                or_(Transaction.amount >= min_val, Transaction.amount <= -min_val)
            )
        except:
            pass
    
    if max_amount:
        try:
            max_val = float(max_amount)
            query = query.filter(
                Transaction.amount <= max_val,
                Transaction.amount >= -max_val
            )
        except:
            pass
    
    # Account filter
    if account_id:
        query = query.filter(Transaction.account_id == int(account_id))
    
    # Category filter
    if category_id:
        query = query.filter(Transaction.category_id == int(category_id))
    
    # Type filter
    if tx_type == 'income':
        query = query.filter(Transaction.amount > 0)
    elif tx_type == 'expense':
        query = query.filter(Transaction.amount < 0)
    
    # Get total count
    total = query.count()
    
    # Paginate
    txs = query.order_by(Transaction.date.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    return jsonify({
        "transactions": [{
            "id": tx.id,
            "amount": tx.amount,
            "description": tx.description,
            "date": tx.date.isoformat(),
            "account_id": tx.account_id,
            "account_name": tx.account.name,
            "category_id": tx.category_id,
            "category_name": tx.category.name if tx.category else None
        } for tx in txs],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }), 200

@transactions_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_transaction(id):
    """Get a single transaction by ID"""
    user_id = get_jwt_identity()
    from models import Account
    
    tx = Transaction.query.join(Account).filter(
        Transaction.id == id, 
        Account.user_id == user_id
    ).first()
    
    if not tx:
        return jsonify({"msg": "Transaction not found"}), 404
    
    return jsonify({
        "id": tx.id,
        "amount": tx.amount,
        "description": tx.description,
        "date": tx.date.isoformat(),
        "account_id": tx.account_id,
        "account_name": tx.account.name,
        "category_id": tx.category_id,
        "category_name": tx.category.name if tx.category else None
    }), 200

@transactions_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_transaction(id):
    """Update an existing transaction"""
    user_id = get_jwt_identity()
    from models import Account
    
    tx = Transaction.query.join(Account).filter(
        Transaction.id == id, 
        Account.user_id == user_id
    ).first()
    
    if not tx:
        return jsonify({"msg": "Transaction not found"}), 404
    
    data = request.get_json()
    
    try:
        # Get the old amount to adjust account balance
        old_amount = tx.amount
        old_account_id = tx.account_id
        
        # Update fields
        if 'amount' in data:
            tx.amount = data['amount']
        if 'description' in data:
            tx.description = data['description']
        if 'date' in data:
            tx.date = datetime.fromisoformat(data['date']) if data['date'] else tx.date
        if 'category_id' in data:
            tx.category_id = data['category_id'] if data['category_id'] else None
        if 'account_id' in data and data['account_id'] != old_account_id:
            # Verify new account belongs to user
            new_account = Account.query.filter_by(id=data['account_id'], user_id=user_id).first()
            if not new_account:
                return jsonify({"msg": "Account not found"}), 404
            
            # Revert balance from old account
            old_account = Account.query.get(old_account_id)
            if old_account:
                old_account.balance -= old_amount
            
            # Apply to new account
            new_account.balance += tx.amount
            tx.account_id = data['account_id']
        else:
            # Same account, just adjust for amount change
            if 'amount' in data:
                account = Account.query.get(tx.account_id)
                if account:
                    # Remove old amount, add new amount
                    account.balance = account.balance - old_amount + tx.amount
        
        db.session.commit()
        return jsonify({
            "msg": "Transaction updated", 
            "id": tx.id,
            "amount": tx.amount,
            "description": tx.description,
            "date": tx.date.isoformat(),
            "account_id": tx.account_id,
            "category_id": tx.category_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error updating transaction", "error": str(e)}), 500

@transactions_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(id):
    user_id = get_jwt_identity()
    # Ensure tx belongs to one of user's accounts
    # Join Transaction -> Account
    from models import Account
    tx = Transaction.query.join(Account).filter(Transaction.id == id, Account.user_id == user_id).first()
    
    if not tx:
        return jsonify({"msg": "Transaction not found"}), 404
        
    try:
        # If it's a split parent, children cascade delete? 
        # SQLAlchemy cascade="all, delete-orphan" should handle children if configured.
        # If it's a child, we just delete it? Logic depends on how strict splits are. 
        # For now, simple delete.
        db.session.delete(tx)
        db.session.commit()
        return jsonify({"msg": "Transaction deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error deleting transaction", "error": str(e)}), 500
