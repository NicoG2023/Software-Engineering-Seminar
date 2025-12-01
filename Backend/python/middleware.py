from functools import wraps
from flask import request, jsonify, current_app
from jose import jwt, JWTError
import requests
import os

# Cache for Keycloak public key
_keycloak_public_key = None


def get_keycloak_public_key():
    """Fetch Keycloak public key for JWT validation"""
    global _keycloak_public_key

    if _keycloak_public_key:
        return _keycloak_public_key

    keycloak_url = os.getenv("KEYCLOAK_SERVER_URL")
    realm = os.getenv("KEYCLOAK_REALM")

    if not keycloak_url or not realm:
        raise ValueError(
            "KEYCLOAK_SERVER_URL and KEYCLOAK_REALM must be set in environment"
        )

    # Fetch realm public key
    url = f"{keycloak_url}/realms/{realm}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        realm_info = response.json()
        public_key = realm_info.get("public_key")

        if not public_key:
            raise ValueError("Public key not found in realm info")

        # Format as PEM
        _keycloak_public_key = (
            f"-----BEGIN PUBLIC KEY-----\n{public_key}\n-----END PUBLIC KEY-----"
        )
        return _keycloak_public_key
    except Exception as e:
        raise ValueError(f"Failed to fetch Keycloak public key: {str(e)}")


def decode_token(token):
    """Decode and validate JWT token from Keycloak"""
    try:
        public_key = get_keycloak_public_key()

        # Decode token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=os.getenv("KEYCLOAK_CLIENT_ID", "cinema-frontend"),
            options={"verify_aud": False},  # Some Keycloak configs don't include aud
        )

        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")


def get_token_from_request():
    """Extract JWT token from Authorization header"""
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    return auth_header.replace("Bearer ", "", 1)


def require_auth(f):
    """Decorator to require authentication for a route"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_request()

        if not token:
            return jsonify({"error": "Missing authentication token"}), 401

        try:
            payload = decode_token(token)
            request.user = payload  # Attach user info to request
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({"error": str(e)}), 401

    return decorated_function


def require_role(role):
    """Decorator to require a specific role for a route"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = get_token_from_request()

            if not token:
                return jsonify({"error": "Missing authentication token"}), 401

            try:
                payload = decode_token(token)
                request.user = payload

                # Check realm roles
                realm_roles = payload.get("realm_access", {}).get("roles", [])

                if role not in realm_roles:
                    return (
                        jsonify(
                            {
                                "error": f"Insufficient permissions. Required role: {role}"
                            }
                        ),
                        403,
                    )

                return f(*args, **kwargs)
            except ValueError as e:
                return jsonify({"error": str(e)}), 401

        return decorated_function

    return decorator


def get_current_user():
    """Get current user from request context"""
    return getattr(request, "user", None)
