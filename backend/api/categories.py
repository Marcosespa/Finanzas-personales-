from flask import Blueprint, request, jsonify
from extensions import db
from models import Category
from flask_jwt_extended import jwt_required, get_jwt_identity

categories_bp = Blueprint('categories', __name__, url_prefix='/categories')

@categories_bp.route('/', methods=['GET'])
@jwt_required()
def get_categories():
    user_id = get_jwt_identity()
    categories = Category.query.filter_by(user_id=user_id).all()
    return jsonify([{
        "id": c.id,
        "name": c.name,
        "type": c.type # expense, income
    } for c in categories]), 200

@categories_bp.route('/', methods=['POST'])
@jwt_required()
def create_category():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    name = data.get('name')
    type_str = data.get('type') # expense, income
    
    if not name or not type_str:
        return jsonify({"msg": "Missing fields"}), 400
        
    new_cat = Category(name=name, type=type_str, user_id=user_id)
    db.session.add(new_cat)
    db.session.commit()
    
    return jsonify({"id": new_cat.id, "name": new_cat.name}), 201

@categories_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_category(id):
    user_id = get_jwt_identity()
    cat = Category.query.filter_by(id=id, user_id=user_id).first()
    if cat:
        db.session.delete(cat)
        db.session.commit()
        return jsonify({"msg": "Deleted"}), 200
    return jsonify({"msg": "Not found"}), 404

@categories_bp.route('/seed', methods=['POST'])
@jwt_required()
def seed_categories():
    user_id = get_jwt_identity()
    
    # Check if user already has categories? Or just add missing ones.
    # Simple approach: Add defaults if they don't exist by name.
    
    defaults = [
        ("Salario", "income"),
        ("Inversiones", "income"),
        ("Vivienda", "expense"),
        ("Comida", "expense"),
        ("Transporte", "expense"),
        ("Servicios", "expense"),
        ("Entretenimiento", "expense"),
        ("Salud", "expense"),
        ("Compras", "expense"),
        ("Educación", "expense"),
        ("Cuidado Personal", "expense"),
    ]
    
    added_count = 0
    for name, type_ in defaults:
        exists = Category.query.filter_by(user_id=user_id, name=name, type=type_).first()
        if not exists:
            cat = Category(name=name, type=type_, user_id=user_id)
            db.session.add(cat)
            added_count += 1
            
    db.session.commit()
    return jsonify({"msg": f"Seeded {added_count} categories"}), 201
