"""
SafeWalk – Location Tracking Routes
Handles location updates and history retrieval.
"""

from flask import Blueprint, request, jsonify
from backend.services.supabase_client import get_supabase_client
from backend.services.location_service import validate_coordinates

location_bp = Blueprint("location", __name__, url_prefix="/api/location")


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


@location_bp.route("/update", methods=["POST"])
def update_location():
    """
    Update user's current location.
    
    Expected JSON:
        { "latitude": float, "longitude": float, "accuracy": float (optional) }
    """
    try:
        user_id, token = _get_user_auth()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json()
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        accuracy = data.get("accuracy")

        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required"}), 400

        if not validate_coordinates(latitude, longitude):
            return jsonify({"error": "Invalid coordinates"}), 400

        supabase = get_supabase_client()
        supabase.postgrest.auth(token)
        result = supabase.table("location_history").insert({
            "user_id": user_id,
            "latitude": latitude,
            "longitude": longitude,
            "accuracy": accuracy,
        }).execute()

        return jsonify({
            "message": "Location updated",
            "record": result.data[0] if result.data else {}
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@location_bp.route("/history", methods=["GET"])
def location_history():
    """Get location history for the authenticated user."""
    try:
        user_id, token = _get_user_auth()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        limit = request.args.get("limit", 100, type=int)

        supabase = get_supabase_client()
        result = supabase.table("location_history").select("*").eq(
            "user_id", user_id
        ).order("recorded_at", desc=True).limit(limit).execute()

        return jsonify({"locations": result.data or []}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@location_bp.route("/latest", methods=["GET"])
def latest_location():
    """Get the most recent location for the authenticated user."""
    try:
        user_id, token = _get_user_auth()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        supabase = get_supabase_client()
        result = supabase.table("location_history").select("*").eq(
            "user_id", user_id
        ).order("recorded_at", desc=True).limit(1).execute()

        if result.data:
            return jsonify({"location": result.data[0]}), 200

        return jsonify({"location": None, "message": "No location data"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
