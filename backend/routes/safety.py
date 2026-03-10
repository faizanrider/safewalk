"""
SafeWalk – Safety Zone & Reporting Routes
Handles safety zone queries and unsafe area reporting.
"""

from flask import Blueprint, request, jsonify
from backend.services.supabase_client import get_supabase_client

safety_bp = Blueprint("safety", __name__, url_prefix="/api/safety")


def _get_user_auth():
    """Extract user ID and token from the Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, None
    token = auth_header.split(" ")[1]
    supabase = get_supabase_client()
    user_resp = supabase.auth.get_user(token)
    if user_resp and user_resp.user:
        return user_resp.user.id, token
    return None, None


@safety_bp.route("/zones", methods=["GET"])
def get_safety_zones():
    """
    Get all safety zones. Optionally filter by safety level.
    
    Query params:
        level: 'safe', 'normal', or 'unsafe' (optional)
    """
    try:
        supabase = get_supabase_client()
        query = supabase.table("safety_zones").select("*")

        level = request.args.get("level")
        if level and level in ("safe", "normal", "unsafe"):
            query = query.eq("safety_level", level)

        result = query.execute()

        return jsonify({"zones": result.data or []}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@safety_bp.route("/reports", methods=["GET"])
def get_reports():
    """Get all safety reports (publicly readable)."""
    try:
        supabase = get_supabase_client()
        result = supabase.table("safety_reports").select("*").order(
            "created_at", desc=True
        ).limit(200).execute()

        return jsonify({"reports": result.data or []}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@safety_bp.route("/report", methods=["POST"])
def report_unsafe_area():
    """
    Report an unsafe area.
    
    Expected JSON:
        {
            "latitude": float,
            "longitude": float,
            "description": str,
            "severity": str (optional: low/medium/high),
            "category": str (optional)
        }
    """
    try:
        user_id, token = _get_user_auth()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json()
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        description = data.get("description", "").strip()

        if latitude is None or longitude is None:
            return jsonify({"error": "Location coordinates are required"}), 400

        if not description:
            return jsonify({"error": "Description is required"}), 400

        severity = data.get("severity", "medium")
        if severity not in ("low", "medium", "high"):
            severity = "medium"

        supabase = get_supabase_client()
        supabase.postgrest.auth(token)
        result = supabase.table("safety_reports").insert({
            "user_id": user_id,
            "latitude": latitude,
            "longitude": longitude,
            "description": description,
            "severity": severity,
            "category": data.get("category", "general"),
        }).execute()

        return jsonify({
            "message": "Unsafe area reported successfully",
            "report": result.data[0] if result.data else {}
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
