from flask import Blueprint, request, jsonify
from extensions import db, jwt, limiter
from models import User, Category
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Docker/load balancers"""
    return jsonify({"status": "healthy", "service": "finanzas-api"}), 200

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    data = request.get_json()
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"msg": "Missing required fields"}), 400

    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.flush() # ID generation

    # Seed Default Categories
    defaults = [
        ("Salary", "income"),
        ("Investments", "income"),
        ("Housing", "expense"),
        ("Food & Dining", "expense"),
        ("Transportation", "expense"),
        ("Utilities", "expense"),
        ("Entertainment", "expense"),
        ("Health", "expense"),
        ("Shopping", "expense"),
    ]
    
    for name, type_ in defaults:
        cat = Category(name=name, type=type_, user_id=new_user.id)
        db.session.add(cat)

    db.session.commit()

    return jsonify({"msg": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 200

    return jsonify({"msg": "Invalid credentials"}), 401

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify(access_token=new_access_token), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile information"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    data = request.get_json()
    
    try:
        # Update username if provided
        if 'username' in data and data['username']:
            new_username = data['username'].strip()
            if new_username != user.username:
                # Check if username is taken
                existing = User.query.filter_by(username=new_username).first()
                if existing:
                    return jsonify({"msg": "El nombre de usuario ya está en uso"}), 409
                user.username = new_username
        
        # Update email if provided
        if 'email' in data and data['email']:
            new_email = data['email'].strip().lower()
            if new_email != user.email:
                # Check if email is taken
                existing = User.query.filter_by(email=new_email).first()
                if existing:
                    return jsonify({"msg": "El email ya está registrado"}), 409
                user.email = new_email
        
        db.session.commit()
        
        return jsonify({
            "msg": "Perfil actualizado",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al actualizar perfil", "error": str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({"msg": "Se requieren la contraseña actual y la nueva"}), 400
    
    # Verify current password
    if not user.check_password(current_password):
        return jsonify({"msg": "La contraseña actual es incorrecta"}), 401
    
    # Validate new password
    if len(new_password) < 6:
        return jsonify({"msg": "La nueva contraseña debe tener al menos 6 caracteres"}), 400
    
    try:
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({"msg": "Contraseña actualizada exitosamente"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al cambiar contraseña", "error": str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per minute")
def forgot_password():
    """Request password reset - generates a reset token"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({"msg": "El email es requerido"}), 400
    
    user = User.query.filter_by(email=email).first()
    
    # Always return success message to prevent email enumeration
    if not user:
        return jsonify({
            "msg": "Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña"
        }), 200
    
    try:
        token = user.generate_reset_token()
        db.session.commit()
        
        # In production, you would send an email here
        # For development, we'll return the token in the response
        # This should be removed in production!
        return jsonify({
            "msg": "Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña",
            # DEV ONLY: Remove this in production
            "dev_token": token,
            "dev_note": "En producción, este token se enviaría por email"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al procesar solicitud", "error": str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("5 per minute")
def reset_password():
    """Reset password using the token"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    token = data.get('token', '').strip()
    new_password = data.get('new_password', '')
    
    if not email or not token or not new_password:
        return jsonify({"msg": "Todos los campos son requeridos"}), 400
    
    if len(new_password) < 6:
        return jsonify({"msg": "La nueva contraseña debe tener al menos 6 caracteres"}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({"msg": "Token inválido o expirado"}), 400
    
    if not user.verify_reset_token(token):
        return jsonify({"msg": "Token inválido o expirado"}), 400
    
    try:
        user.set_password(new_password)
        user.clear_reset_token()
        db.session.commit()
        
        return jsonify({"msg": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al actualizar contraseña", "error": str(e)}), 500
