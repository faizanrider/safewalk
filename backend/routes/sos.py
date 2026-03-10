"""
SafeWalk – SOS Emergency Alert Routes
Handles SOS triggering, notification dispatch, and event history.
"""

from flask import Blueprint, request, jsonify
from backend.services.supabase_client import get_supabase_client
from backend.services.sms_service import send_sms, build_sos_message
from backend.services.email_service import send_email, build_sos_email

sos_bp = Blueprint("sos", __name__, url_prefix="/api/sos")


def _get_user_from_token():
    """Extract user info from the Authorization token."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, None, None
    token = auth_header.split(" ")[1]
    supabase = get_supabase_client()
    user_resp = supabase.auth.get_user(token)
    if user_resp and user_resp.user:
        return user_resp.user.id, user_resp.user.email, token
    return None, None, None


@sos_bp.route("/trigger", methods=["POST"])
def trigger_sos():
    """
    Trigger an SOS emergency alert.
    
    Expected JSON:
        { "latitude": float, "longitude": float }
    
    Actions:
        1. Log the SOS event in the database
        2. Fetch all emergency contacts
        3. Send SMS to each contact with phone number
        4. Send email to each contact with email address
    """
    try:
        user_id, user_email, token = _get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json()
        latitude = data.get("latitude")
        longitude = data.get("longitude")

        if latitude is None or longitude is None:
            return jsonify({"error": "Location coordinates required"}), 400

        supabase = get_supabase_client()
        supabase.postgrest.auth(token)

        # Get user profile for name safely
        profile = supabase.table("profiles").select("full_name").eq(
            "id", user_id
        ).execute()
        
        user_name = user_email
        if profile.data and len(profile.data) > 0:
            user_name = profile.data[0].get("full_name", user_email)

        # Log SOS event in database
        sos_event = supabase.table("sos_events").insert({
            "user_id": user_id,
            "latitude": latitude,
            "longitude": longitude,
            "status": "triggered",
        }).execute()

        event_id = sos_event.data[0]["event_id"] if sos_event.data else None

        # Fetch emergency contacts
        contacts = supabase.table("emergency_contacts").select("*").eq(
            "user_id", user_id
        ).execute()

        contacts_notified = 0
        sms_results = []
        email_results = []

        if contacts.data:
            # Build alert messages
            sms_body = build_sos_message(user_name, latitude, longitude)
            email_subject, email_html = build_sos_email(user_name, latitude, longitude)

            for contact in contacts.data:
                # Send SMS if phone number exists
                if contact.get("phone_number"):
                    sms_result = send_sms(contact["phone_number"], sms_body)
                    sms_results.append({
                        "contact": contact["contact_name"],
                        **sms_result
                    })
                    if sms_result.get("success"):
                        contacts_notified += 1

                # Send email if email exists
                if contact.get("email"):
                    email_result = send_email(
                        contact["email"], email_subject, email_html
                    )
                    email_results.append({
                        "contact": contact["contact_name"],
                        **email_result
                    })
                    if email_result.get("success"):
                        contacts_notified += 1

        # Update SOS event with notification count
        if event_id:
            supabase.table("sos_events").update({
                "contacts_notified": contacts_notified,
                "status": "notified" if contacts_notified > 0 else "pending",
            }).eq("event_id", event_id).execute()

        return jsonify({
            "message": "SOS alert triggered",
            "event_id": event_id,
            "contacts_notified": contacts_notified,
            "sms_results": sms_results,
            "email_results": email_results,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sos_bp.route("/history", methods=["GET"])
def sos_history():
    """Get SOS event history for the authenticated user."""
    try:
        user_id, _, token = _get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        supabase = get_supabase_client()
        supabase.postgrest.auth(token)
        result = supabase.table("sos_events").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).limit(50).execute()

        return jsonify({"events": result.data or []}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sos_bp.route("/resolve/<event_id>", methods=["PUT"])
def resolve_sos(event_id):
    """Mark an SOS event as resolved."""
    try:
        user_id, _, token = _get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        supabase = get_supabase_client()
        supabase.postgrest.auth(token)
        supabase.table("sos_events").update({
            "status": "resolved",
            "resolved_at": "now()",
        }).eq("event_id", event_id).eq("user_id", user_id).execute()

        return jsonify({"message": "SOS event resolved"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
