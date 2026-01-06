from extensions import db
from datetime import datetime
import enum

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

class Rule(BaseModel):
    __tablename__ = 'rules'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pattern = db.Column(db.String(100), nullable=False) # regex or simple string
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    description = db.Column(db.String(200)) # Optional override description
