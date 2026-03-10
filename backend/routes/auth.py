"""
SafeWalk – Authentication Routes
Handles user registration, login, and logout via Supabase Auth.
"""

from flask import Blueprint, request, jsonify
from backend.services.supabase_client import get_supabase_client

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """Register a new user."""
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        password = data.get("password", "")
        full_name = data.get("full_name", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        supabase = get_supabase_client()

        # Create user in Supabase Auth
        result = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {"data": {"full_name": full_name}}
        })

        if result.user:
            # Create profile record
            supabase.table("profiles").insert({
                "id": result.user.id,
                "full_name": full_name,
            }).execute()

            return jsonify({
                "message": "Account created successfully",
                "user": {
                    "id": result.user.id,
                    "email": result.user.email,
                    "full_name": full_name,
                }
            }), 201

        return jsonify({"error": "Signup failed"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user and return session."""
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        supabase = get_supabase_client()

        result = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if result.user:
            return jsonify({
                "message": "Login successful",
                "user": {
                    "id": result.user.id,
                    "email": result.user.email,
                },
                "access_token": result.session.access_token,
                "refresh_token": result.session.refresh_token,
            }), 200

        return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Log out the current user."""
    try:
        supabase = get_supabase_client()
        supabase.auth.sign_out()
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    """Get the currently authenticated user's profile."""
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization token"}), 401

        token = auth_header.split(" ")[1]
        supabase = get_supabase_client()

        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            user = user_response.user
            # Fetch profile
            profile = supabase.table("profiles").select("*").eq(
                "id", user.id
            ).single().execute()

            return jsonify({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": profile.data.get("full_name", "") if profile.data else "",
                    "phone": profile.data.get("phone", "") if profile.data else "",
                }
            }), 200

        return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500
