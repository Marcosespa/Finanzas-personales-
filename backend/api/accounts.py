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
