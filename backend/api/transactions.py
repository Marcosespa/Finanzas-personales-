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
    # Basic pagination and filtering could go here
    # For now, return all (optimize later)
    # Join with Account to filter by user
    from models import Account
    
    txs = Transaction.query.join(Account).filter(Account.user_id == user_id).order_by(Transaction.date.desc()).limit(50).all()
    
    result = []
    for tx in txs:
        if tx.parent_id is None: # Show only main transactions or standalone
            result.append({
                "id": tx.id,
                "amount": tx.amount,
                "description": tx.description,
                "date": tx.date.isoformat(),
                "account_name": tx.account.name,
                "splits_count": len(tx.children)
            })
            
    return jsonify(result), 200
            
    return jsonify(result), 200

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
