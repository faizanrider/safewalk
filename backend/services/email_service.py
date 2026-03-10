"""
SafeWalk – Email Service (SMTP / Gmail)
Sends email alerts to emergency contacts via SMTP.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.config import Config


def send_email(to_email: str, subject: str, body_html: str) -> dict:
    """
    Send an email via SMTP (Gmail).

    Args:
        to_email: Recipient email address
        subject: Email subject line
        body_html: HTML body content

    Returns:
        dict with success status and error info if any
    """
    try:
        if not all([Config.SMTP_EMAIL, Config.SMTP_PASSWORD]):
            return {
                "success": False,
                "error": "SMTP credentials not configured. Check .env file."
            }

        msg = MIMEMultipart("alternative")
        msg["From"] = f"SafeWalk Alerts <{Config.SMTP_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
            server.sendmail(Config.SMTP_EMAIL, to_email, msg.as_string())

        return {"success": True}

    except Exception as e:
        return {"success": False, "error": str(e)}


def build_sos_email(user_name: str, latitude: float, longitude: float) -> tuple:
    """
    Build SOS alert email subject and HTML body.

    Returns:
        (subject, html_body) tuple
    """
    maps_link = f"https://maps.google.com/?q={latitude},{longitude}"
    subject = f"🚨 SAFEWALK SOS ALERT – {user_name} needs help!"

    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 16px; overflow: hidden; color: #ffffff;">
        <div style="background: linear-gradient(135deg, #e74c3c, #c0392b);
                    padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">🚨 SOS ALERT</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">SafeWalk Emergency Notification</p>
        </div>
        <div style="padding: 30px;">
            <p style="font-size: 18px; margin-bottom: 20px;">
                <strong>{user_name}</strong> may be in danger and has triggered an SOS alert.
            </p>
            <div style="background: rgba(255,255,255,0.1); border-radius: 12px;
                        padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 12px; font-size: 14px; opacity: 0.8;">📍 LIVE LOCATION</p>
                <p style="margin: 0; font-size: 16px;">
                    Lat: {latitude} | Lng: {longitude}
                </p>
                <a href="{maps_link}" style="display: inline-block; margin-top: 16px;
                   background: #e74c3c; color: white; padding: 12px 28px;
                   border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Open in Google Maps →
                </a>
            </div>
            <p style="font-size: 14px; opacity: 0.7; margin-top: 24px;">
                Please check on them immediately. This alert was sent automatically by SafeWalk.
            </p>
        </div>
    </div>
    """
    return subject, html
