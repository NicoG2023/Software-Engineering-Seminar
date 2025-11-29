from flask import Blueprint, jsonify, request
from middleware import require_auth, require_role, get_current_user, decode_token, get_token_from_request

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/validate', methods=['POST'])
def validate_token():
    """Validate a JWT token"""
    token = get_token_from_request()
    
    if not token:
        # Try to get token from request body
        data = request.get_json()
        token = data.get('token') if data else None
    
    if not token:
        return jsonify({"error": "No token provided"}), 400
    
    try:
        payload = decode_token(token)
        return jsonify({
            "valid": True,
            "user": {
                "username": payload.get('preferred_username'),
                "email": payload.get('email'),
                "roles": payload.get('realm_access', {}).get('roles', []),
                "sub": payload.get('sub')
            }
        }), 200
    except ValueError as e:
        return jsonify({"valid": False, "error": str(e)}), 401


@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_me():
    """Get current user information"""
    user = get_current_user()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "username": user.get('preferred_username'),
        "email": user.get('email'),
        "roles": user.get('realm_access', {}).get('roles', []),
        "sub": user.get('sub'),
        "name": user.get('name'),
        "given_name": user.get('given_name'),
        "family_name": user.get('family_name')
    }), 200


@auth_bp.route('/users', methods=['GET'])
@require_role('admin')
def list_users():
    """List all users - Admin only (placeholder for now)"""
    # This would typically fetch from Keycloak or your database
    # For now, returning current user info as example
    user = get_current_user()
    
    return jsonify({
        "message": "This endpoint would list all users from Keycloak",
        "current_user": {
            "username": user.get('preferred_username'),
            "email": user.get('email'),
            "roles": user.get('realm_access', {}).get('roles', [])
        }
    }), 200


@auth_bp.route('/check-admin', methods=['GET'])
@require_auth
def check_admin():
    """Check if current user is admin"""
    user = get_current_user()
    roles = user.get('realm_access', {}).get('roles', [])
    
    return jsonify({
        "is_admin": 'admin' in roles,
        "roles": roles
    }), 200
