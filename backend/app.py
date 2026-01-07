from flask import Flask, jsonify
from config import Config
from extensions import db, migrate, ma, jwt, cors, limiter
from api.auth import auth_bp
from api.accounts import accounts_bp
from api.categories import categories_bp
from api.transactions import transactions_bp
from api.transfers import transfers_bp
from api.investments import investments_bp
from api.dashboard import dashboard_bp
from api.exchange_rates import exchange_rates_bp
from api.budgets import budgets_bp
from api.savings_goals import savings_goals_bp
from api.recurring import recurring_bp
from api.export import export_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    jwt.init_app(app)
    
    # Debugging JWT Errors
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"DEBUG: JWT Invalid Token: {error}")
        return jsonify({"msg": f"Invalid token: {error}"}), 422

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        print(f"DEBUG: JWT Missing Token: {error}")
        return jsonify({"msg": f"Missing token: {error}"}), 401

    # CORS configuration - Allow all origins and methods for development
    cors.init_app(app, 
        resources={r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }}
    )
    limiter.init_app(app)

    with app.app_context():
        # Import models so Alembic can detect them
        # We import * to ensure all models are registered
        from models import User, Account, CreditCard, Transaction, Transfer, Category, Investment, InvestmentPriceHistory, ExchangeRate, Budget, Rule, SavingsGoal, RecurringTransaction
        
        # Placeholder for Routes
        # from api import register_routes
        # register_routes(app)
        app.register_blueprint(auth_bp)
        app.register_blueprint(accounts_bp)
        app.register_blueprint(categories_bp)
        app.register_blueprint(transactions_bp)
        app.register_blueprint(transfers_bp)
        app.register_blueprint(investments_bp)
        app.register_blueprint(dashboard_bp)
        app.register_blueprint(exchange_rates_bp)
        app.register_blueprint(budgets_bp)
        app.register_blueprint(savings_goals_bp)
        app.register_blueprint(recurring_bp)
        app.register_blueprint(export_bp)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
