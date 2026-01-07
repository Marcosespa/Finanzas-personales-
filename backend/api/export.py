from flask import Blueprint, request, jsonify, Response
from extensions import db
from models import Transaction, Account, Category, Transfer
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import csv
import io

export_bp = Blueprint('export', __name__, url_prefix='/export')

@export_bp.route('/transactions', methods=['GET'])
@jwt_required()
def export_transactions():
    """Export transactions to CSV"""
    user_id = get_jwt_identity()
    
    # Get query params for filtering
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    account_id = request.args.get('account_id')
    category_id = request.args.get('category_id')
    tx_type = request.args.get('type')  # income, expense, all
    
    # Build query
    query = Transaction.query.join(Account).filter(
        Account.user_id == user_id,
        Transaction.deleted_at == None,
        Transaction.parent_id == None  # Only main transactions
    )
    
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
    
    if account_id:
        query = query.filter(Transaction.account_id == int(account_id))
    
    if category_id:
        query = query.filter(Transaction.category_id == int(category_id))
    
    if tx_type == 'income':
        query = query.filter(Transaction.amount > 0)
    elif tx_type == 'expense':
        query = query.filter(Transaction.amount < 0)
    
    transactions = query.order_by(Transaction.date.desc()).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'Fecha',
        'Descripción',
        'Monto',
        'Tipo',
        'Cuenta',
        'Categoría',
        'ID'
    ])
    
    # Data rows
    for tx in transactions:
        tx_type_label = 'Ingreso' if tx.amount > 0 else 'Gasto'
        if tx.transfer_id:
            tx_type_label = 'Transferencia'
        
        writer.writerow([
            tx.date.strftime('%Y-%m-%d') if tx.date else '',
            tx.description or '',
            tx.amount,
            tx_type_label,
            tx.account.name if tx.account else '',
            tx.category.name if tx.category else 'Sin categoría',
            tx.id
        ])
    
    output.seek(0)
    
    # Generate filename with date range
    filename = f"transacciones_{datetime.now().strftime('%Y%m%d')}"
    if start_date:
        filename += f"_desde_{start_date}"
    if end_date:
        filename += f"_hasta_{end_date}"
    filename += ".csv"
    
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename={filename}',
            'Content-Type': 'text/csv; charset=utf-8'
        }
    )

@export_bp.route('/accounts', methods=['GET'])
@jwt_required()
def export_accounts():
    """Export accounts summary to CSV"""
    user_id = get_jwt_identity()
    
    accounts = Account.query.filter_by(user_id=user_id, deleted_at=None).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        'Nombre',
        'Tipo',
        'Institución',
        'Moneda',
        'Saldo',
        'ID'
    ])
    
    type_labels = {
        'cash': 'Efectivo',
        'bank': 'Banco',
        'credit': 'Crédito',
        'investment': 'Inversión'
    }
    
    for acc in accounts:
        writer.writerow([
            acc.name,
            type_labels.get(acc.type.value, acc.type.value) if acc.type else '',
            acc.institution or '',
            acc.currency_code,
            acc.balance,
            acc.id
        ])
    
    output.seek(0)
    
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename=cuentas_{datetime.now().strftime("%Y%m%d")}.csv',
            'Content-Type': 'text/csv; charset=utf-8'
        }
    )

@export_bp.route('/full-report', methods=['GET'])
@jwt_required()
def export_full_report():
    """Export a full financial report"""
    user_id = get_jwt_identity()
    
    # Get date range
    year = request.args.get('year', datetime.now().year)
    month = request.args.get('month')  # Optional
    
    # Build query
    query = Transaction.query.join(Account).filter(
        Account.user_id == user_id,
        Transaction.deleted_at == None,
        Transaction.parent_id == None
    )
    
    try:
        year = int(year)
        from sqlalchemy import extract
        query = query.filter(extract('year', Transaction.date) == year)
        
        if month:
            month = int(month)
            query = query.filter(extract('month', Transaction.date) == month)
    except:
        pass
    
    transactions = query.order_by(Transaction.date.desc()).all()
    
    # Calculate summary
    total_income = sum(tx.amount for tx in transactions if tx.amount > 0)
    total_expense = sum(abs(tx.amount) for tx in transactions if tx.amount < 0)
    net = total_income - total_expense
    
    # Group by category
    by_category = {}
    for tx in transactions:
        cat_name = tx.category.name if tx.category else 'Sin categoría'
        if cat_name not in by_category:
            by_category[cat_name] = {'income': 0, 'expense': 0}
        if tx.amount > 0:
            by_category[cat_name]['income'] += tx.amount
        else:
            by_category[cat_name]['expense'] += abs(tx.amount)
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Summary section
    writer.writerow(['=== RESUMEN FINANCIERO ==='])
    period_label = f"{year}" if not month else f"{month}/{year}"
    writer.writerow(['Período', period_label])
    writer.writerow(['Total Ingresos', total_income])
    writer.writerow(['Total Gastos', total_expense])
    writer.writerow(['Balance Neto', net])
    writer.writerow([])
    
    # By category section
    writer.writerow(['=== POR CATEGORÍA ==='])
    writer.writerow(['Categoría', 'Ingresos', 'Gastos', 'Neto'])
    for cat_name, values in sorted(by_category.items()):
        cat_net = values['income'] - values['expense']
        writer.writerow([cat_name, values['income'], values['expense'], cat_net])
    writer.writerow([])
    
    # Transactions detail
    writer.writerow(['=== DETALLE DE TRANSACCIONES ==='])
    writer.writerow(['Fecha', 'Descripción', 'Monto', 'Tipo', 'Cuenta', 'Categoría'])
    
    for tx in transactions:
        tx_type_label = 'Ingreso' if tx.amount > 0 else 'Gasto'
        if tx.transfer_id:
            tx_type_label = 'Transferencia'
        
        writer.writerow([
            tx.date.strftime('%Y-%m-%d') if tx.date else '',
            tx.description or '',
            tx.amount,
            tx_type_label,
            tx.account.name if tx.account else '',
            tx.category.name if tx.category else 'Sin categoría'
        ])
    
    output.seek(0)
    
    filename = f"reporte_financiero_{period_label.replace('/', '-')}.csv"
    
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename={filename}',
            'Content-Type': 'text/csv; charset=utf-8'
        }
    )

