from flask import Blueprint, request, jsonify
from extensions import db
from models import RecurringTransaction, RecurrenceFrequency, Transaction, Account
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from dateutil.relativedelta import relativedelta

recurring_bp = Blueprint('recurring', __name__, url_prefix='/recurring')

@recurring_bp.route('/', methods=['GET'])
@jwt_required()
def get_recurring_transactions():
    """Get all recurring transactions for the current user"""
    user_id = get_jwt_identity()
    
    recurring = RecurringTransaction.query.filter_by(
        user_id=user_id, 
        deleted_at=None
    ).order_by(RecurringTransaction.next_due.asc()).all()
    
    return jsonify([{
        "id": r.id,
        "name": r.name,
        "amount": r.amount,
        "description": r.description,
        "frequency": r.frequency.value if r.frequency else 'monthly',
        "day_of_month": r.day_of_month,
        "account_id": r.account_id,
        "account_name": r.account.name if r.account else None,
        "category_id": r.category_id,
        "category_name": r.category.name if r.category else None,
        "start_date": r.start_date.isoformat() if r.start_date else None,
        "end_date": r.end_date.isoformat() if r.end_date else None,
        "next_due": r.next_due.isoformat() if r.next_due else None,
        "last_generated": r.last_generated.isoformat() if r.last_generated else None,
        "is_active": r.is_active
    } for r in recurring]), 200

@recurring_bp.route('/', methods=['POST'])
@jwt_required()
def create_recurring_transaction():
    """Create a new recurring transaction"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate account belongs to user
    account = Account.query.filter_by(id=data.get('account_id'), user_id=user_id).first()
    if not account:
        return jsonify({"msg": "Cuenta no encontrada"}), 404
    
    try:
        frequency = RecurrenceFrequency(data.get('frequency', 'monthly'))
    except ValueError:
        frequency = RecurrenceFrequency.MONTHLY
    
    try:
        recurring = RecurringTransaction(
            user_id=user_id,
            account_id=data.get('account_id'),
            category_id=data.get('category_id'),
            name=data.get('name'),
            amount=float(data.get('amount', 0)),
            description=data.get('description'),
            frequency=frequency,
            day_of_month=int(data.get('day_of_month', 1)),
            start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else datetime.utcnow(),
            end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
            is_active=data.get('is_active', True)
        )
        
        # Calculate first next_due
        recurring.next_due = recurring.start_date
        if recurring.frequency == RecurrenceFrequency.MONTHLY:
            try:
                recurring.next_due = recurring.next_due.replace(day=min(recurring.day_of_month, 28))
            except ValueError:
                pass
        
        db.session.add(recurring)
        db.session.commit()
        
        return jsonify({
            "msg": "Transacción recurrente creada",
            "id": recurring.id,
            "name": recurring.name,
            "next_due": recurring.next_due.isoformat() if recurring.next_due else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al crear transacción recurrente", "error": str(e)}), 500

@recurring_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_recurring_transaction(id):
    """Update a recurring transaction"""
    user_id = get_jwt_identity()
    
    recurring = RecurringTransaction.query.filter_by(
        id=id, 
        user_id=user_id, 
        deleted_at=None
    ).first()
    
    if not recurring:
        return jsonify({"msg": "Transacción recurrente no encontrada"}), 404
    
    data = request.get_json()
    
    try:
        if 'name' in data:
            recurring.name = data['name']
        if 'amount' in data:
            recurring.amount = float(data['amount'])
        if 'description' in data:
            recurring.description = data['description']
        if 'frequency' in data:
            try:
                recurring.frequency = RecurrenceFrequency(data['frequency'])
            except ValueError:
                pass
        if 'day_of_month' in data:
            recurring.day_of_month = int(data['day_of_month'])
        if 'account_id' in data:
            account = Account.query.filter_by(id=data['account_id'], user_id=user_id).first()
            if account:
                recurring.account_id = data['account_id']
        if 'category_id' in data:
            recurring.category_id = data['category_id']
        if 'end_date' in data:
            recurring.end_date = datetime.fromisoformat(data['end_date']) if data['end_date'] else None
        if 'is_active' in data:
            recurring.is_active = data['is_active']
        
        # Recalculate next_due if frequency or day changed
        if 'frequency' in data or 'day_of_month' in data:
            recurring.calculate_next_due()
        
        db.session.commit()
        
        return jsonify({
            "msg": "Transacción recurrente actualizada",
            "id": recurring.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al actualizar", "error": str(e)}), 500

@recurring_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_recurring_transaction(id):
    """Soft delete a recurring transaction"""
    user_id = get_jwt_identity()
    
    recurring = RecurringTransaction.query.filter_by(
        id=id, 
        user_id=user_id, 
        deleted_at=None
    ).first()
    
    if not recurring:
        return jsonify({"msg": "Transacción recurrente no encontrada"}), 404
    
    try:
        recurring.deleted_at = datetime.utcnow()
        recurring.is_active = False
        db.session.commit()
        
        return jsonify({"msg": "Transacción recurrente eliminada"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al eliminar", "error": str(e)}), 500

@recurring_bp.route('/process', methods=['POST'])
@jwt_required()
def process_recurring_transactions():
    """
    Process all due recurring transactions and create actual transactions.
    Called on dashboard load or manually.
    """
    user_id = get_jwt_identity()
    
    # Get all active recurring transactions that are due
    now = datetime.utcnow()
    recurring_list = RecurringTransaction.query.filter(
        RecurringTransaction.user_id == user_id,
        RecurringTransaction.deleted_at == None,
        RecurringTransaction.is_active == True,
        RecurringTransaction.next_due <= now
    ).all()
    
    created_count = 0
    
    for recurring in recurring_list:
        # Check if end_date has passed
        if recurring.end_date and now > recurring.end_date:
            recurring.is_active = False
            continue
        
        try:
            # Create the actual transaction
            tx = Transaction(
                account_id=recurring.account_id,
                amount=recurring.amount,
                description=f"[Recurrente] {recurring.name}" + (f" - {recurring.description}" if recurring.description else ""),
                date=recurring.next_due or now,
                category_id=recurring.category_id
            )
            db.session.add(tx)
            
            # Update account balance
            account = Account.query.get(recurring.account_id)
            if account:
                account.balance += recurring.amount
            
            # Update recurring transaction
            recurring.last_generated = now
            recurring.calculate_next_due()
            
            created_count += 1
            
        except Exception as e:
            print(f"Error processing recurring {recurring.id}: {e}")
            continue
    
    db.session.commit()
    
    return jsonify({
        "msg": f"Procesadas {created_count} transacciones recurrentes",
        "count": created_count
    }), 200

@recurring_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_recurring():
    """Get upcoming recurring transactions for the next 30 days"""
    user_id = get_jwt_identity()
    
    now = datetime.utcnow()
    thirty_days = now + relativedelta(days=30)
    
    upcoming = RecurringTransaction.query.filter(
        RecurringTransaction.user_id == user_id,
        RecurringTransaction.deleted_at == None,
        RecurringTransaction.is_active == True,
        RecurringTransaction.next_due >= now,
        RecurringTransaction.next_due <= thirty_days
    ).order_by(RecurringTransaction.next_due.asc()).all()
    
    return jsonify([{
        "id": r.id,
        "name": r.name,
        "amount": r.amount,
        "next_due": r.next_due.isoformat() if r.next_due else None,
        "account_name": r.account.name if r.account else None,
        "category_name": r.category.name if r.category else None
    } for r in upcoming]), 200

