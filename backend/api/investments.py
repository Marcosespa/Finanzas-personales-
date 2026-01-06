from flask import Blueprint, request, jsonify
from extensions import db, limiter
from services.investment_service import InvestmentService
from models import Investment, AssetType
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

investments_bp = Blueprint('investments', __name__, url_prefix='/investments')

@investments_bp.route('/', methods=['GET'])
@jwt_required()
def get_portfolio():
    user_id = get_jwt_identity()
    # Join Accounts to user
    from models import Account
    
    investments = Investment.query.join(Account).filter(Account.user_id == user_id).all()
    
    result = []
    for inv in investments:
        current_val = inv.quantity * inv.price_history[-1].price if inv.price_history else inv.quantity * inv.avg_buy_price
        # Note: In real app, we fetch live price. Here we use last history price.
        
        result.append({
            "symbol": inv.symbol,
            "name": inv.name,
            "quantity": inv.quantity,
            "avg_buy_price": inv.avg_buy_price,
            "current_value": current_val,
            "total_cost": inv.total_cost,
            "unrealized_profit": current_val - inv.total_cost,
            "account_id": inv.account_id
        })
        
    return jsonify(result), 200

@investments_bp.route('/trade', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def trade():
    data = request.get_json()
    action = data.get('action') # buy, sell
    
    try:
        if action == 'buy':
            inv = InvestmentService.buy_asset(
                account_id=data.get('account_id'),
                symbol=data.get('symbol'),
                quantity=float(data.get('quantity')),
                price=float(data.get('price')),
                date=datetime.fromisoformat(data['date']) if data.get('date') else None,
                asset_type=AssetType(data.get('asset_type', 'stock'))
            )
        elif action == 'sell':
             inv = InvestmentService.sell_asset(
                account_id=data.get('account_id'),
                symbol=data.get('symbol'),
                quantity=float(data.get('quantity')),
                price=float(data.get('price')),
                date=datetime.fromisoformat(data['date']) if data.get('date') else None
            )
        else:
            return jsonify({"msg": "Invalid action"}), 400
            
        return jsonify({"msg": "Trade executed", "symbol": inv.symbol}), 201
        
    except ValueError as e:
        return jsonify({"msg": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error executing trade", "error": str(e)}), 500
