"""
SafeWalk – SMS Service (Twilio)
Sends SMS alerts to emergency contacts via Twilio API.
"""

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

from backend.config import Config


def send_sms(to_number: str, message: str) -> dict:
    """
    Send an SMS message via Twilio.

    Args:
        to_number: Recipient phone number
        message: The SMS message body

    Returns:
        dict with status and message SID or error info
    """
    try:
        # Basic Sanitation: Ensure E.164 format for India specifically if + is missing
        to_number = to_number.strip()
        if not to_number.startswith("+"):
            if len(to_number) == 10 and to_number[0] in "6789":
                to_number = "+91" + to_number
            else:
                 # Generic fallback if no sign is present
                 to_number = "+" + to_number

        if not TWILIO_AVAILABLE:
            return {
                "success": False,
                "error": "Twilio package not installed. Run: pip install twilio"
            }

        # Check for SID + Token + (Phone OR MessagingServiceSid)
        if not all([Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN]):
            return {
                "success": False,
                "error": "Twilio Account SID or Auth Token missing."
            }
        
        if not (Config.TWILIO_PHONE_NUMBER or Config.TWILIO_MESSAGING_SERVICE_SID):
            return {
                "success": False,
                "error": "Twilio Sender not configured. Add TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID to .env."
            }

        client = TwilioClient(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)

        # Prepare parameters
        msg_params = {
            "body": message,
            "to": to_number
        }
        
        if Config.TWILIO_MESSAGING_SERVICE_SID:
            msg_params["messaging_service_sid"] = Config.TWILIO_MESSAGING_SERVICE_SID
        else:
            msg_params["from_"] = Config.TWILIO_PHONE_NUMBER

        sms = client.messages.create(**msg_params)

        return {
            "success": True,
            "sid": sms.sid,
            "status": sms.status
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def build_sos_message(user_name: str, latitude: float, longitude: float) -> str:
    """
    Build a simple SOS alert with an urgent message and a clickable Google Maps link.
    """
    maps_link = f"https://maps.google.com/?q={latitude},{longitude}"
    return (
        f"🚨 HELP! I AM IN DANGER! 🚨 "
        f"This is {user_name}. Click to see my location: {maps_link}"
    )
