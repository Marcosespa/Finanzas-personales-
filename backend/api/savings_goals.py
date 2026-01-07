from flask import Blueprint, request, jsonify
from extensions import db
from models import SavingsGoal
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

savings_goals_bp = Blueprint('savings_goals', __name__, url_prefix='/savings-goals')

@savings_goals_bp.route('/', methods=['GET'])
@jwt_required()
def get_savings_goals():
    """Get all savings goals for the current user"""
    user_id = get_jwt_identity()
    
    goals = SavingsGoal.query.filter_by(user_id=user_id, deleted_at=None).order_by(SavingsGoal.created_at.desc()).all()
    
    return jsonify([{
        "id": g.id,
        "name": g.name,
        "target_amount": g.target_amount,
        "current_amount": g.current_amount,
        "target_date": g.target_date.isoformat() if g.target_date else None,
        "icon": g.icon,
        "color": g.color,
        "is_active": g.is_active,
        "progress_percentage": g.progress_percentage,
        "days_remaining": g.days_remaining
    } for g in goals]), 200

@savings_goals_bp.route('/', methods=['POST'])
@jwt_required()
def create_savings_goal():
    """Create a new savings goal"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        goal = SavingsGoal(
            user_id=user_id,
            name=data.get('name'),
            target_amount=float(data.get('target_amount', 0)),
            current_amount=float(data.get('current_amount', 0)),
            target_date=datetime.fromisoformat(data['target_date']) if data.get('target_date') else None,
            icon=data.get('icon', '🎯'),
            color=data.get('color', 'amber'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(goal)
        db.session.commit()
        
        return jsonify({
            "msg": "Savings goal created",
            "id": goal.id,
            "name": goal.name
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error creating savings goal", "error": str(e)}), 500

@savings_goals_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_savings_goal(id):
    """Get a single savings goal"""
    user_id = get_jwt_identity()
    
    goal = SavingsGoal.query.filter_by(id=id, user_id=user_id, deleted_at=None).first()
    
    if not goal:
        return jsonify({"msg": "Savings goal not found"}), 404
    
    return jsonify({
        "id": goal.id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "target_date": goal.target_date.isoformat() if goal.target_date else None,
        "icon": goal.icon,
        "color": goal.color,
        "is_active": goal.is_active,
        "progress_percentage": goal.progress_percentage,
        "days_remaining": goal.days_remaining
    }), 200

@savings_goals_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_savings_goal(id):
    """Update a savings goal"""
    user_id = get_jwt_identity()
    
    goal = SavingsGoal.query.filter_by(id=id, user_id=user_id, deleted_at=None).first()
    
    if not goal:
        return jsonify({"msg": "Savings goal not found"}), 404
    
    data = request.get_json()
    
    try:
        if 'name' in data:
            goal.name = data['name']
        if 'target_amount' in data:
            goal.target_amount = float(data['target_amount'])
        if 'current_amount' in data:
            goal.current_amount = float(data['current_amount'])
        if 'target_date' in data:
            goal.target_date = datetime.fromisoformat(data['target_date']) if data['target_date'] else None
        if 'icon' in data:
            goal.icon = data['icon']
        if 'color' in data:
            goal.color = data['color']
        if 'is_active' in data:
            goal.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            "msg": "Savings goal updated",
            "id": goal.id,
            "name": goal.name,
            "target_amount": goal.target_amount,
            "current_amount": goal.current_amount,
            "progress_percentage": goal.progress_percentage
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error updating savings goal", "error": str(e)}), 500

@savings_goals_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_savings_goal(id):
    """Soft delete a savings goal"""
    user_id = get_jwt_identity()
    
    goal = SavingsGoal.query.filter_by(id=id, user_id=user_id, deleted_at=None).first()
    
    if not goal:
        return jsonify({"msg": "Savings goal not found"}), 404
    
    try:
        goal.deleted_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({"msg": "Savings goal deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error deleting savings goal", "error": str(e)}), 500

@savings_goals_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_goal():
    """Get the primary active savings goal (for dashboard widget)"""
    user_id = get_jwt_identity()
    
    # Get the first active goal
    goal = SavingsGoal.query.filter_by(
        user_id=user_id, 
        is_active=True, 
        deleted_at=None
    ).order_by(SavingsGoal.created_at.asc()).first()
    
    if not goal:
        return jsonify(None), 200
    
    return jsonify({
        "id": goal.id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "target_date": goal.target_date.isoformat() if goal.target_date else None,
        "icon": goal.icon,
        "color": goal.color,
        "progress_percentage": goal.progress_percentage,
        "days_remaining": goal.days_remaining
    }), 200

