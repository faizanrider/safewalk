"""
SafeWalk – Emergency Contacts Routes
CRUD operations for managing emergency contacts.
"""

from flask import Blueprint, request, jsonify
from backend.services.supabase_client import get_supabase_client

contacts_bp = Blueprint("contacts", __name__, url_prefix="/api/contacts")


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


@contacts_bp.route("", methods=["GET"])
def get_contacts():
    """Get all emergency contacts for the authenticated user."""
    try:
        user_id, token = _get_user_auth()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        supabase = get_supabase_client()
        supabase.postgrest.auth(token)
        result = supabase.table("emergency_contacts").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()

        return jsonify({"contacts": result.data or []}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@contacts_bp.route("", methods=["POST"])
def add_contact():
    """Add a new emergency contact."""
    try:
        user_id, token = _get_user_auth()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json()
        contact_name = data.get("contact_name", "").strip()
        phone_number = data.get("phone_number", "").strip()
        email = data.get("email", "").strip()
        relationship = data.get("relationship", "").strip()

        if not contact_name or not phone_number:
            return jsonify({"error": "Name and phone number are required"}), 400

        supabase = get_supabase_client()
        supabase.postgrest.auth(token)
        result = supabase.table("emergency_contacts").insert({
            "user_id": user_id,
            "contact_name": contact_name,
            "phone_number": phone_number,
            "email": email,
            "relationship": relationship,
        }).execute()

        return jsonify({
            "message": "Contact added successfully",
            "contact": result.data[0] if result.data else {}
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@contacts_bp.route("/<contact_id>", methods=["PUT"])
def update_contact(contact_id):
    """Update an existing emergency contact."""
    try:
        user_id, token = _get_user_auth()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json()
        updates = {}
        for field in ["contact_name", "phone_number", "email", "relationship"]:
            if field in data:
                updates[field] = data[field].strip() if isinstance(data[field], str) else data[field]

        if not updates:
            return jsonify({"error": "No fields to update"}), 400

        supabase = get_supabase_client()
        supabase.postgrest.auth(token)
        result = supabase.table("emergency_contacts").update(updates).eq(
            "contact_id", contact_id
        ).eq("user_id", user_id).execute()

        return jsonify({
            "message": "Contact updated successfully",
            "contact": result.data[0] if result.data else {}
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@contacts_bp.route("/<contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    """Delete an emergency contact."""
    try:
        user_id, token = _get_user_auth()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        supabase = get_supabase_client()
        supabase.postgrest.auth(token)
        supabase.table("emergency_contacts").delete().eq(
            "contact_id", contact_id
        ).eq("user_id", user_id).execute()

        return jsonify({"message": "Contact deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
