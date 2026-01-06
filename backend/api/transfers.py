from flask import Blueprint, request, jsonify
from extensions import db, limiter
from services.transfer_service import TransferService
from models import Transfer
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

transfers_bp = Blueprint('transfers', __name__, url_prefix='/transfers')

@transfers_bp.route('/', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def create_transfer():
    data = request.get_json()
    
    try:
        transfer = TransferService.create_transfer(
            from_account_id=data.get('from_account_id'),
            to_account_id=data.get('to_account_id'),
            amount=data.get('amount'),
            date=datetime.fromisoformat(data['date']) if data.get('date') else None,
            description=data.get('description')
        )
        return jsonify({"msg": "Transfer successful", "id": transfer.id}), 201
    except ValueError as e:
        return jsonify({"msg": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error processing transfer", "error": str(e)}), 500

@transfers_bp.route('/', methods=['GET'])
@jwt_required()
def get_transfers():
    user_id = get_jwt_identity()
    # Join with Account to verify ownership? 
    # Simply listing all transfers where one of the accounts belongs to user
    from models import Account
    from sqlalchemy import or_
    
    # Query transfers where from_acc.user_id == me OR to_acc.user_id == me
    transfers = Transfer.query.join(Account, Transfer.from_account_id == Account.id)\
        .filter(Account.user_id == user_id).all()
        
    # Ideally should check both sides but assume single user system for now (or intra-user transfers)
    
    return jsonify([{
        "id": t.id,
        "from": t.from_account_id,
        "to": t.to_account_id,
        "amount": t.amount,
        "date": t.date.isoformat(),
        "description": t.description
    } for t in transfers]), 200
