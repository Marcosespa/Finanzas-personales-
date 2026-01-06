from flask import Blueprint, request, jsonify
from extensions import db
from models import ExchangeRate
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import requests

exchange_rates_bp = Blueprint('exchange_rates', __name__, url_prefix='/exchange-rates')

# Mock rates for development - In production, use external API
MOCK_RATES = {
    'COP_EUR': 0.00022,
    'COP_USD': 0.00024,
    'COP_CZK': 0.0055,
    'EUR_COP': 4500,
    'EUR_USD': 1.1,
    'EUR_CZK': 25,
    'USD_COP': 4200,
    'USD_EUR': 0.91,
    'USD_CZK': 23,
    'CZK_COP': 180,
    'CZK_EUR': 0.04,
    'CZK_USD': 0.043
}

@exchange_rates_bp.route('/', methods=['GET'])
@jwt_required()
def get_exchange_rates():
    """Get all exchange rates"""
    rates = ExchangeRate.query.order_by(ExchangeRate.date.desc()).limit(20).all()
    
    return jsonify([{
        'id': r.id,
        'currency_from': r.currency_from,
        'currency_to': r.currency_to,
        'rate': r.rate,
        'date': r.date.isoformat()
    } for r in rates]), 200

@exchange_rates_bp.route('/convert', methods=['GET'])
@jwt_required()
def convert_currency():
    """Quick currency conversion"""
    from_currency = request.args.get('from', 'COP')
    to_currency = request.args.get('to', 'EUR')
    amount = float(request.args.get('amount', 1))
    
    # Look up rate in database first
    rate_record = ExchangeRate.query.filter_by(
        currency_from=from_currency,
        currency_to=to_currency
    ).order_by(ExchangeRate.date.desc()).first()
    
    if rate_record:
        rate = rate_record.rate
    else:
        # Fallback to mock rates
        key = f"{from_currency}_{to_currency}"
        rate = MOCK_RATES.get(key, 1)
    
    converted = amount * rate
    
    return jsonify({
        'from_currency': from_currency,
        'to_currency': to_currency,
        'amount': amount,
        'converted': converted,
        'rate': rate
    }), 200

@exchange_rates_bp.route('/update', methods=['POST'])
@jwt_required()
def update_rates():
    """Update exchange rates (manual or from API)"""
    data = request.get_json()
    
    currency_from = data.get('currency_from')
    currency_to = data.get('currency_to')
    rate = data.get('rate')
    
    if not all([currency_from, currency_to, rate]):
        return jsonify({'msg': 'Missing required fields'}), 400
    
    # Create new rate record
    new_rate = ExchangeRate(
        currency_from=currency_from,
        currency_to=currency_to,
        rate=float(rate),
        date=datetime.utcnow()
    )
    
    db.session.add(new_rate)
    db.session.commit()
    
    return jsonify({
        'msg': 'Rate updated',
        'rate': {
            'currency_from': currency_from,
            'currency_to': currency_to,
            'rate': rate
        }
    }), 201

@exchange_rates_bp.route('/seed', methods=['POST'])
@jwt_required()
def seed_rates():
    """Seed database with mock rates"""
    added = 0
    
    for key, rate in MOCK_RATES.items():
        from_curr, to_curr = key.split('_')
        
        # Check if exists
        existing = ExchangeRate.query.filter_by(
            currency_from=from_curr,
            currency_to=to_curr
        ).order_by(ExchangeRate.date.desc()).first()
        
        # Only add if doesn't exist or is old (more than 1 day)
        if not existing or (datetime.utcnow() - existing.date).days > 1:
            new_rate = ExchangeRate(
                currency_from=from_curr,
                currency_to=to_curr,
                rate=rate,
                date=datetime.utcnow()
            )
            db.session.add(new_rate)
            added += 1
    
    db.session.commit()
    
    return jsonify({'msg': f'Seeded {added} exchange rates'}), 201
