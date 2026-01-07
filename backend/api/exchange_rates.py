from flask import Blueprint, request, jsonify
from extensions import db
from models import ExchangeRate
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import requests

exchange_rates_bp = Blueprint('exchange_rates', __name__, url_prefix='/exchange-rates')

# Supported currencies
SUPPORTED_CURRENCIES = ['COP', 'EUR', 'USD', 'CZK']

# Cache for API rates (in-memory, could use Redis in production)
_rates_cache = {
    'rates': {},
    'last_updated': None
}

def fetch_live_rates(base='EUR'):
    """
    Fetch live exchange rates from frankfurter.app API
    Returns rates relative to base currency
    """
    try:
        # Frankfurter API (free, no key needed)
        url = f"https://api.frankfurter.app/latest?from={base}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            return data.get('rates', {})
    except Exception as e:
        print(f"Error fetching rates: {e}")
    
    return None

# Hardcoded fallback rates (realistic rates as of 2024)
# COP is not supported by ECB/Frankfurter API, so we need manual rates
FALLBACK_RATES = {
    'COP_EUR': 0.00022,      # 1 COP = 0.00022 EUR (1 EUR ≈ 4500 COP)
    'COP_USD': 0.00024,      # 1 COP = 0.00024 USD (1 USD ≈ 4200 COP)
    'COP_CZK': 0.0057,       # 1 COP = 0.0057 CZK (1 CZK ≈ 175 COP)
    'EUR_COP': 4500,         # 1 EUR = 4500 COP
    'EUR_USD': 1.08,         # 1 EUR = 1.08 USD
    'EUR_CZK': 25.3,         # 1 EUR = 25.3 CZK
    'USD_COP': 4200,         # 1 USD = 4200 COP
    'USD_EUR': 0.93,         # 1 USD = 0.93 EUR
    'USD_CZK': 23.5,         # 1 USD = 23.5 CZK
    'CZK_COP': 175,          # 1 CZK = 175 COP
    'CZK_EUR': 0.04,         # 1 CZK = 0.04 EUR
    'CZK_USD': 0.043         # 1 CZK = 0.043 USD
}

# Currencies NOT supported by Frankfurter API (ECB doesn't track them)
UNSUPPORTED_BY_API = ['COP']

def get_all_rates():
    """
    Get rates for all supported currency pairs
    Returns a dict like {'COP_EUR': 0.00022, 'EUR_COP': 4500, ...}
    
    Note: COP is not supported by the ECB/Frankfurter API, so we use
    fallback rates for any pair involving COP.
    """
    global _rates_cache
    
    # Check cache (valid for 1 hour)
    if (_rates_cache['last_updated'] and 
        datetime.utcnow() - _rates_cache['last_updated'] < timedelta(hours=1)):
        return _rates_cache['rates']
    
    all_rates = {}
    api_success = False
    
    # Try to fetch from API
    try:
        # Get EUR-based rates first
        eur_rates = fetch_live_rates('EUR')
        if eur_rates:
            api_success = True
            # Add EUR as base
            eur_rates['EUR'] = 1.0
            
            # Calculate cross rates for API-supported currencies
            api_supported = [c for c in SUPPORTED_CURRENCIES if c not in UNSUPPORTED_BY_API]
            
            for from_curr in api_supported:
                for to_curr in api_supported:
                    if from_curr == to_curr:
                        continue
                    
                    key = f"{from_curr}_{to_curr}"
                    
                    if from_curr == 'EUR':
                        rate = eur_rates.get(to_curr)
                    elif to_curr == 'EUR':
                        from_rate = eur_rates.get(from_curr)
                        rate = 1 / from_rate if from_rate else None
                    else:
                        # Cross rate: from_curr -> EUR -> to_curr
                        from_rate = eur_rates.get(from_curr)
                        to_rate = eur_rates.get(to_curr)
                        if from_rate and to_rate:
                            rate = (1 / from_rate) * to_rate
                        else:
                            rate = None
                    
                    if rate:
                        all_rates[key] = rate
    except Exception as e:
        print(f"Error calculating rates from API: {e}")
    
    # For any COP pairs or missing rates, use fallback values
    for key, fallback_rate in FALLBACK_RATES.items():
        if key not in all_rates:
            all_rates[key] = fallback_rate
    
    # Update cache
    _rates_cache['rates'] = all_rates
    _rates_cache['last_updated'] = datetime.utcnow() if api_success else None
    
    return all_rates

@exchange_rates_bp.route('/', methods=['GET'])
@jwt_required()
def get_exchange_rates():
    """Get all current exchange rates"""
    rates = get_all_rates()
    
    # Format response
    result = []
    for key, rate in rates.items():
        from_curr, to_curr = key.split('_')
        result.append({
            'from': from_curr,
            'to': to_curr,
            'rate': rate
        })
    
    return jsonify({
        'rates': result,
        'last_updated': _rates_cache.get('last_updated', datetime.utcnow()).isoformat() if _rates_cache.get('last_updated') else None,
        'source': 'live' if _rates_cache.get('last_updated') else 'fallback'
    }), 200

@exchange_rates_bp.route('/convert', methods=['GET'])
@jwt_required()
def convert_currency():
    """Quick currency conversion with live rates"""
    from_currency = request.args.get('from', 'COP').upper()
    to_currency = request.args.get('to', 'EUR').upper()
    amount = float(request.args.get('amount', 1))
    
    if from_currency == to_currency:
        return jsonify({
            'from_currency': from_currency,
            'to_currency': to_currency,
            'amount': amount,
            'converted': amount,
            'rate': 1.0,
            'source': 'live'
        }), 200
    
    rates = get_all_rates()
    key = f"{from_currency}_{to_currency}"
    rate = rates.get(key)
    
    # If rate not found, use fallback
    if rate is None:
        rate = FALLBACK_RATES.get(key, 1)
        source = 'fallback'
    else:
        # Check if this pair involves COP (which uses fallback rates)
        if from_currency in UNSUPPORTED_BY_API or to_currency in UNSUPPORTED_BY_API:
            source = 'fallback'
        else:
            source = 'live' if _rates_cache.get('last_updated') else 'fallback'
    
    converted = amount * rate
    
    return jsonify({
        'from_currency': from_currency,
        'to_currency': to_currency,
        'amount': amount,
        'converted': round(converted, 2),
        'rate': rate,
        'source': source
    }), 200

@exchange_rates_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_rates():
    """Force refresh of exchange rates from API"""
    global _rates_cache
    
    # Clear cache to force refresh
    _rates_cache['last_updated'] = None
    
    rates = get_all_rates()
    
    if _rates_cache.get('last_updated'):
        # Save to database for historical tracking
        for key, rate in rates.items():
            from_curr, to_curr = key.split('_')
            new_rate = ExchangeRate(
                currency_from=from_curr,
                currency_to=to_curr,
                rate=rate,
                date=datetime.utcnow()
            )
            db.session.add(new_rate)
        
        try:
            db.session.commit()
        except:
            db.session.rollback()
        
        return jsonify({
            'msg': 'Tasas actualizadas desde API en tiempo real',
            'count': len(rates),
            'last_updated': _rates_cache['last_updated'].isoformat()
        }), 200
    else:
        return jsonify({
            'msg': 'No se pudo conectar con la API, usando tasas de respaldo',
            'count': len(rates)
        }), 200

@exchange_rates_bp.route('/history', methods=['GET'])
@jwt_required()
def get_rate_history():
    """Get historical rates for a currency pair"""
    from_currency = request.args.get('from', 'EUR')
    to_currency = request.args.get('to', 'COP')
    days = int(request.args.get('days', 30))
    
    since = datetime.utcnow() - timedelta(days=days)
    
    rates = ExchangeRate.query.filter(
        ExchangeRate.currency_from == from_currency,
        ExchangeRate.currency_to == to_currency,
        ExchangeRate.date >= since
    ).order_by(ExchangeRate.date.asc()).all()
    
    return jsonify([{
        'date': r.date.isoformat(),
        'rate': r.rate
    } for r in rates]), 200
