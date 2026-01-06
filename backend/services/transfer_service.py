from extensions import db
from models import Transfer, Account, AccountType
from services.transaction_service import TransactionService
from datetime import datetime

class TransferService:
    @staticmethod
    def create_transfer(from_account_id, to_account_id, amount, date=None, description=None):
        if amount <= 0:
            raise ValueError("Transfer amount must be positive")
            
        from_acc = Account.query.get(from_account_id)
        to_acc = Account.query.get(to_account_id)
        
        if not from_acc or not to_acc:
             raise ValueError("Account not found")

        # Create Transfer Record
        transfer = Transfer(
            from_account_id=from_account_id,
            to_account_id=to_account_id,
            amount=amount,
            date=date or datetime.utcnow(),
            description=description
        )
        db.session.add(transfer)
        db.session.flush() # Get ID

        # Create Withdrawal Transaction (From)
        t1 = TransactionService.create_transaction(
            account_id=from_account_id,
            amount=-amount,
            description=f"Transfer to {to_acc.name}" + (f": {description}" if description else ""),
            date=date,
            # We could link to transfer_id if we added that field to Transaction model as polymorphic
            # In models.py we have 'transfer_id' in Transaction? Yes.
        )
        t1.transfer_id = transfer.id

        # Create Deposit Transaction (To)
        t2 = TransactionService.create_transaction(
            account_id=to_account_id,
            amount=amount,
            description=f"Transfer from {from_acc.name}" + (f": {description}" if description else ""),
            date=date
        )
        t2.transfer_id = transfer.id
        
        db.session.commit()
        return transfer
