from extensions import db
from datetime import datetime, timedelta
import enum
import secrets

class AccountType(str, enum.Enum):
    CASH = 'cash'
    BANK = 'bank'
    CREDIT = 'credit'
    INVESTMENT = 'investment'

class AssetType(str, enum.Enum):
    STOCK = 'stock'
    ETF = 'etf'
    CRYPTO = 'crypto'
    BOND = 'bond'
    FUND = 'fund'

class RecurrenceFrequency(str, enum.Enum):
    DAILY = 'daily'
    WEEKLY = 'weekly'
    BIWEEKLY = 'biweekly'
    MONTHLY = 'monthly'
    YEARLY = 'yearly'

class BaseModel(db.Model):
    __abstract__ = True
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

class User(BaseModel):
    __tablename__ = 'users'
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    def generate_reset_token(self):
        """Generate a password reset token valid for 1 hour"""
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        return self.reset_token
    
    def verify_reset_token(self, token):
        """Verify if reset token is valid"""
        if not self.reset_token or not self.reset_token_expires:
            return False
        if self.reset_token != token:
            return False
        if datetime.utcnow() > self.reset_token_expires:
            return False
        return True
    
    def clear_reset_token(self):
        """Clear reset token after use"""
        self.reset_token = None
        self.reset_token_expires = None
    
    accounts = db.relationship('Account', backref='user', lazy=True)

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

class Account(BaseModel):
    __tablename__ = 'accounts'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.Enum(AccountType), nullable=False)
    institution = db.Column(db.String(100), nullable=True)
    currency_code = db.Column(db.String(3), default='COP', nullable=False)
    balance = db.Column(db.Float, default=0.0) # Cached balance
    
    credit_card = db.relationship('CreditCard', uselist=False, backref='account', cascade="all, delete-orphan")
    investments = db.relationship('Investment', backref='account', lazy=True)
    transactions = db.relationship('Transaction', backref='account', lazy=True)

class CreditCard(db.Model):
    __tablename__ = 'credit_cards'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    credit_limit = db.Column(db.Float, nullable=False)
    billing_day = db.Column(db.Integer, nullable=False) # Day of month (1-31)
    payment_due_day = db.Column(db.Integer, nullable=False) # Day of month
    interest_rate = db.Column(db.Float, default=0.0)

class Category(BaseModel):
    __tablename__ = 'categories'
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(20), nullable=False) # expense, income
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

class Transaction(BaseModel):
    __tablename__ = 'transactions'
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False) # Negative for expense, Positive for income
    description = db.Column(db.String(200))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    category = db.relationship('Category', backref='transactions', lazy=True)
    
    # Splits / Parent
    parent_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=True)
    children = db.relationship('Transaction', backref=db.backref('parent', remote_side='Transaction.id'), lazy=True)

    # Polymorphic links (Transfer, Investment operation) could be done here or handled by service logic
    transfer_id = db.Column(db.Integer, db.ForeignKey('transfers.id'), nullable=True)

class Transfer(BaseModel):
    __tablename__ = 'transfers'
    from_account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    to_account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.String(200))

class Investment(BaseModel):
    __tablename__ = 'investments'
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100))
    asset_type = db.Column(db.Enum(AssetType), nullable=False)
    sector = db.Column(db.String(50))
    risk_level = db.Column(db.String(20)) # low, medium, high
    
    quantity = db.Column(db.Float, default=0.0)
    avg_buy_price = db.Column(db.Float, default=0.0)
    
    price_history = db.relationship('InvestmentPriceHistory', backref='investment', lazy=True)

    @property
    def total_cost(self):
        return self.quantity * self.avg_buy_price

class InvestmentPriceHistory(BaseModel):
    __tablename__ = 'investment_price_history'
    investment_id = db.Column(db.Integer, db.ForeignKey('investments.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)

class ExchangeRate(BaseModel):
    __tablename__ = 'exchange_rates'
    currency_from = db.Column(db.String(3), nullable=False)
    currency_to = db.Column(db.String(3), nullable=False)
    rate = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)

class Budget(BaseModel):
    __tablename__ = 'budgets'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), default='monthly') # monthly, yearly
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    
    # Relationship
    category = db.relationship('Category', backref='budgets', lazy=True)

class Rule(BaseModel):
    __tablename__ = 'rules'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pattern = db.Column(db.String(100), nullable=False) # regex or simple string
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    description = db.Column(db.String(200)) # Optional override description

class SavingsGoal(BaseModel):
    __tablename__ = 'savings_goals'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # e.g., "Viaje a Europa", "Fondo de emergencia"
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, default=0.0)  # Can be manually tracked or auto-calculated
    target_date = db.Column(db.DateTime, nullable=True)
    icon = db.Column(db.String(10), default='🎯')  # Emoji or icon code
    color = db.Column(db.String(20), default='amber')  # Color theme
    is_active = db.Column(db.Boolean, default=True)
    
    @property
    def progress_percentage(self):
        if self.target_amount <= 0:
            return 0
        return min((self.current_amount / self.target_amount) * 100, 100)
    
    @property
    def days_remaining(self):
        if not self.target_date:
            return None
        delta = self.target_date - datetime.utcnow()
        return max(delta.days, 0)

class RecurringTransaction(BaseModel):
    __tablename__ = 'recurring_transactions'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    
    name = db.Column(db.String(100), nullable=False)  # e.g., "Netflix", "Arriendo", "Gimnasio"
    amount = db.Column(db.Float, nullable=False)  # Negative for expenses, positive for income
    description = db.Column(db.String(200))
    
    frequency = db.Column(db.Enum(RecurrenceFrequency), default=RecurrenceFrequency.MONTHLY)
    day_of_month = db.Column(db.Integer, default=1)  # 1-31 for monthly, 1-7 for weekly (Mon=1)
    
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)  # Null means indefinite
    
    last_generated = db.Column(db.DateTime, nullable=True)  # Last time a transaction was auto-generated
    next_due = db.Column(db.DateTime, nullable=True)  # Next scheduled date
    
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    account = db.relationship('Account', backref='recurring_transactions')
    category = db.relationship('Category', backref='recurring_transactions')
    
    def calculate_next_due(self):
        """Calculate the next due date based on frequency"""
        from dateutil.relativedelta import relativedelta
        
        base_date = self.last_generated or self.start_date
        
        if self.frequency == RecurrenceFrequency.DAILY:
            self.next_due = base_date + timedelta(days=1)
        elif self.frequency == RecurrenceFrequency.WEEKLY:
            self.next_due = base_date + timedelta(weeks=1)
        elif self.frequency == RecurrenceFrequency.BIWEEKLY:
            self.next_due = base_date + timedelta(weeks=2)
        elif self.frequency == RecurrenceFrequency.MONTHLY:
            self.next_due = base_date + relativedelta(months=1)
            # Adjust to specific day of month
            try:
                self.next_due = self.next_due.replace(day=min(self.day_of_month, 28))
            except ValueError:
                pass
        elif self.frequency == RecurrenceFrequency.YEARLY:
            self.next_due = base_date + relativedelta(years=1)
        
        return self.next_due
    
    def should_generate(self):
        """Check if a new transaction should be generated"""
        if not self.is_active:
            return False
        if self.end_date and datetime.utcnow() > self.end_date:
            return False
        if not self.next_due:
            return True
        return datetime.utcnow() >= self.next_due
