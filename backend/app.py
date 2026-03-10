"""
SafeWalk – Smart Personal Safety Navigation System
Main Flask Application Entry Point

Run: python backend/app.py
"""

import os
import sys

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, render_template, send_from_directory, jsonify
from flask_cors import CORS
# Load environment variables (handled within backend.config)
from backend.config import Config
from backend.routes.auth import auth_bp
from backend.routes.contacts import contacts_bp
from backend.routes.sos import sos_bp
from backend.routes.location import location_bp
from backend.routes.safety import safety_bp


def create_app():
    """Create and configure the Flask application."""

    app = Flask(
        __name__,
        template_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "templates"),
        static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "static"),
    )

    app.config["SECRET_KEY"] = Config.SECRET_KEY

    # Enable CORS for all routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ── Register Blueprints ──────────────────────────
    app.register_blueprint(auth_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(sos_bp)
    app.register_blueprint(location_bp)
    app.register_blueprint(safety_bp)

    # ── Page Routes ──────────────────────────────────

    @app.route("/")
    def index():
        """Landing / Home page."""
        return render_template("index.html", maps_key=Config.GOOGLE_MAPS_API_KEY)

    @app.route("/login")
    def login_page():
        """Login page."""
        return render_template("login.html")

    @app.route("/signup")
    def signup_page():
        """Signup page."""
        return render_template("signup.html")

    @app.route("/dashboard")
    def dashboard_page():
        """User dashboard."""
        return render_template("dashboard.html")

    @app.route("/map")
    def map_page():
        """Map page with safety visualization."""
        return render_template("map.html", maps_key=Config.GOOGLE_MAPS_API_KEY)

    # ── API Config endpoint (for frontend) ───────────
    @app.route("/api/config", methods=["GET"])
    def get_config():
        """Return public configuration for the frontend."""
        return jsonify({
            "supabase_url": Config.SUPABASE_URL,
            "supabase_anon_key": Config.SUPABASE_ANON_KEY,
            "google_maps_api_key": Config.GOOGLE_MAPS_API_KEY,
        })

    # ── Health check ─────────────────────────────────
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "ok", "service": "SafeWalk API"}), 200

    # ── Error handlers ───────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app


# ── Run Application ──────────────────────────────────
if __name__ == "__main__":
    app = create_app()
    app.run(
        host="0.0.0.0",
        port=Config.PORT,
        debug=Config.DEBUG
    )
