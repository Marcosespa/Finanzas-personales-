from extensions import db, limiter
from models import Transaction, Account, AccountType
from datetime import datetime

class TransactionService:
    @staticmethod
    def create_transaction(account_id, amount, category_id=None, description=None, date=None, parent_id=None):
        """
        Creates a transaction and updates the account balance.
        If parent_id is provided, it's a split transaction.
        """
        # Validate Account
        account = Account.query.get(account_id)
        if not account:
            raise ValueError("Account not found")

        # Create Transaction
        tx = Transaction(
            account_id=account_id,
            amount=amount,
            category_id=category_id,
            description=description,
            date=date or datetime.utcnow(),
            parent_id=parent_id
        )
        
        db.session.add(tx)
        
        # Update Balance (Transactional)
        # Only update balance if this is a main transaction (not a split child)
        if parent_id is None:
            account.balance += amount
        
        return tx

    @staticmethod
    def create_split_transaction(user_id, main_tx_data, splits_data):
        """
        main_tx_data: dict with account_id, amount, description, date
        splits_data: list of dicts with amount, category_id, description
        """
        # Create Main TX (updates balance)
        main_tx = TransactionService.create_transaction(
            account_id=main_tx_data['account_id'],
            amount=main_tx_data['amount'],
            description=main_tx_data.get('description'),
            date=main_tx_data.get('date'),
            category_id=None 
        )
        
        db.session.flush() # Get ID
        
        # Verify Amounts match? 
        # total_splits = sum(s['amount'] for s in splits_data)
        # if abs(total_splits - main_tx.amount) > 0.01: raise ValueError("Split amounts do not match total")

        for split in splits_data:
            TransactionService.create_transaction(
                account_id=main_tx.account_id,
                amount=split['amount'],
                category_id=split.get('category_id'),
                description=split.get('description'),
                date=main_tx.date,
                parent_id=main_tx.id
            )
            
        db.session.commit()
        return main_tx
