#!/usr/bin/env python3
"""
Script para recalcular balances de todas las cuentas
Ejecutar: python recalculate_balances.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from extensions import db
from models import Account, Transaction
from sqlalchemy import func

def recalculate_all_balances():
    """Recalcula los balances de todas las cuentas basándose en transacciones"""
    app = create_app()
    
    with app.app_context():
        # Obtener todas las cuentas activas
        accounts = Account.query.filter_by(deleted_at=None).all()
        
        print(f"📊 Recalculando balances para {len(accounts)} cuentas...\n")
        
        updated_count = 0
        total_difference = 0
        
        for account in accounts:
            # Calcular balance correcto: suma de todas las transacciones principales
            result = db.session.query(
                func.coalesce(func.sum(Transaction.amount), 0.0)
            ).filter(
                Transaction.account_id == account.id,
                Transaction.parent_id.is_(None),  # Solo transacciones principales
                Transaction.deleted_at.is_(None)   # No incluir eliminadas
            ).scalar()
            
            old_balance = account.balance
            new_balance = float(result) if result else 0.0
            difference = new_balance - old_balance
            
            # Actualizar balance si hay diferencia
            if abs(difference) > 0.01:
                account.balance = new_balance
                updated_count += 1
                total_difference += abs(difference)
                
                print(f"✅ {account.name} (ID: {account.id})")
                print(f"   Balance anterior: ${old_balance:,.2f}")
                print(f"   Balance nuevo:    ${new_balance:,.2f}")
                print(f"   Diferencia:       ${difference:+,.2f}\n")
            else:
                print(f"✓ {account.name} (ID: {account.id}) - Balance correcto: ${new_balance:,.2f}")
        
        # Guardar cambios
        db.session.commit()
        
        print(f"\n{'='*60}")
        print(f"📈 Resumen:")
        print(f"   Cuentas revisadas: {len(accounts)}")
        print(f"   Cuentas actualizadas: {updated_count}")
        print(f"   Diferencia total corregida: ${total_difference:,.2f}")
        print(f"{'='*60}\n")
        
        if updated_count > 0:
            print("✅ ¡Balances recalculados exitosamente!")
        else:
            print("✓ Todos los balances ya estaban correctos.")

if __name__ == "__main__":
    try:
        recalculate_all_balances()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


