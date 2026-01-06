from flask import Blueprint, request, jsonify
from extensions import db
from models import Budget, Category
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

budgets_bp = Blueprint('budgets', __name__, url_prefix='/budgets')

@budgets_bp.route('/', methods=['GET'])
@jwt_required()
def get_budgets():
    """Get all budgets for the current user"""
    user_id = get_jwt_identity()
    budgets = Budget.query.filter_by(user_id=user_id).all()
    
    result = []
    for budget in budgets:
        result.append({
            'id': budget.id,
            'category_id': budget.category_id,
            'category_name': budget.category.name if budget.category else 'Unknown',
            'amount': budget.amount,
            'period': budget.period,
            'start_date': budget.start_date.isoformat() if budget.start_date else None,
            'end_date': budget.end_date.isoformat() if budget.end_date else None,
            'created_at': budget.created_at.isoformat()
        })
    
    return jsonify(result), 200

@budgets_bp.route('/', methods=['POST'])
@jwt_required()
def create_budget():
    """Create a new budget"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    category_id = data.get('category_id')
    amount = data.get('amount')
    period = data.get('period', 'monthly')
    
    if not category_id or not amount:
        return jsonify({'msg': 'Missing required fields'}), 400
    
    # Verify category belongs to user
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()
    if not category:
        return jsonify({'msg': 'Category not found'}), 404
    
    # Check if budget already exists for this category
    existing = Budget.query.filter_by(
        user_id=user_id,
        category_id=category_id,
        period=period
    ).first()
    
    if existing:
        return jsonify({'msg': 'Budget for this category already exists'}), 400
    
    budget = Budget(
        user_id=user_id,
        category_id=category_id,
        amount=float(amount),
        period=period,
        start_date=datetime.utcnow()
    )
    
    db.session.add(budget)
    db.session.commit()
    
    return jsonify({
        'msg': 'Budget created',
        'id': budget.id
    }), 201

@budgets_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_budget(id):
    """Update an existing budget"""
    user_id = get_jwt_identity()
    budget = Budget.query.filter_by(id=id, user_id=user_id).first()
    
    if not budget:
        return jsonify({'msg': 'Budget not found'}), 404
    
    data = request.get_json()
    
    if 'amount' in data:
        budget.amount = float(data['amount'])
    if 'period' in data:
        budget.period = data['period']
    
    db.session.commit()
    
    return jsonify({'msg': 'Budget updated'}), 200

@budgets_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_budget(id):
    """Delete a budget"""
    user_id = get_jwt_identity()
    budget = Budget.query.filter_by(id=id, user_id=user_id).first()
    
    if not budget:
        return jsonify({'msg': 'Budget not found'}), 404
    
    db.session.delete(budget)
    db.session.commit()
    
    return jsonify({'msg': 'Budget deleted'}), 200

@budgets_bp.route('/status', methods=['GET'])
@jwt_required()
def get_budget_status():
    """Get budget status with actual spending"""
    user_id = get_jwt_identity()
    
    from models import Transaction, Account
    from datetime import datetime, timedelta
    from sqlalchemy import func, extract
    
    # Get current month
    today = datetime.utcnow()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    budgets = Budget.query.filter_by(user_id=user_id).all()
    
    result = []
    for budget in budgets:
        # Calculate actual spending for this category in current month
        actual = 0
        
        txs = Transaction.query.join(Account).filter(
            Account.user_id == user_id,
            Transaction.category_id == budget.category_id,
            Transaction.date >= month_start,
            Transaction.amount < 0,  # expenses only
            Transaction.transfer_id == None
        ).all()
        
        actual = sum(abs(tx.amount) for tx in txs)
        
        utilization = (actual / budget.amount) * 100 if budget.amount > 0 else 0
        
        result.append({
            'budget_id': budget.id,
            'category': budget.category.name if budget.category else 'Unknown',
            'category_id': budget.category_id,
            'limit': budget.amount,
            'actual': actual,
            'remaining': budget.amount - actual,
            'utilization': utilization,
            'status': 'over' if utilization > 100 else 'warning' if utilization > 80 else 'good'
        })
    
    return jsonify(result), 200
