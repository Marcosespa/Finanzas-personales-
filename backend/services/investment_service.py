from extensions import db
from models import Investment, InvestmentPriceHistory, Account, Transaction, AssetType
from services.transaction_service import TransactionService
from datetime import datetime

class InvestmentService:
    @staticmethod
    def buy_asset(account_id, symbol, quantity, price, date=None, asset_type=AssetType.STOCK, name=None):
        if quantity <= 0 or price < 0:
             raise ValueError("Invalid quantity or price")
             
        # Create Transaction (Outflow from Investment Account - representing Cash usage)
        cost = quantity * price
        TransactionService.create_transaction(
            account_id=account_id,
            amount=-cost,
            description=f"Buy {symbol} ({quantity} @ {price})",
            date=date
        )
        
        # Update or Create Investment Holding
        inv = Investment.query.filter_by(account_id=account_id, symbol=symbol).first()
        if inv:
            # Avg Buy Price Calculation
            # new_avg = ((old_qty * old_avg) + (new_qty * new_price)) / total_qty
            total_qty = inv.quantity + quantity
            total_cost = (inv.quantity * inv.avg_buy_price) + (quantity * price)
            inv.avg_buy_price = total_cost / total_qty
            inv.quantity = total_qty
        else:
            inv = Investment(
                account_id=account_id,
                symbol=symbol,
                quantity=quantity,
                avg_buy_price=price,
                asset_type=asset_type,
                name=name or symbol
            )
            db.session.add(inv)
            
        # Record Price History
        history = InvestmentPriceHistory(
            investment=inv,
            price=price,
            date=date or datetime.utcnow()
        )
        db.session.add(history)
        
        db.session.commit()
        return inv

    @staticmethod
    def sell_asset(account_id, symbol, quantity, price, date=None):
        inv = Investment.query.filter_by(account_id=account_id, symbol=symbol).first()
        if not inv or inv.quantity < quantity:
            raise ValueError("Insufficient holdings")
            
        # Create Transaction (Inflow)
        revenue = quantity * price
        TransactionService.create_transaction(
            account_id=account_id,
            amount=revenue,
            description=f"Sell {symbol} ({quantity} @ {price})",
            date=date
        )
        
        # Update Holding
        # Avg buy price usually doesn't change on sell (FIFO/Avg Cost depend on accounting, assuming Avg Cost stays same)
        inv.quantity -= quantity
        
        # If quantity 0, keep record but maybe mark inactive? For now just 0.
        
        # Record Price History (Market price at sell time)
        history = InvestmentPriceHistory(
            investment=inv,
            price=price,
            date=date or datetime.utcnow()
        )
        db.session.add(history)
        
        db.session.commit()
        return inv
