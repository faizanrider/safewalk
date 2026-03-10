"""
SafeWalk – Supabase Client Service
Provides a singleton Supabase client for database operations.
"""

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = object

from backend.config import Config


def get_supabase_client():
    """Create and return a Supabase client instance."""
    if not SUPABASE_AVAILABLE:
        raise RuntimeError(
            "Supabase package is not installed. Run: pip install supabase"
        )
    if not Config.SUPABASE_URL or not Config.SUPABASE_ANON_KEY:
        raise ValueError(
            "Supabase URL and Anon Key must be set in environment variables. "
            "Please check your .env file."
        )
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY)


def get_supabase_admin():
    """Create a Supabase client with service role key for admin operations."""
    if not SUPABASE_AVAILABLE:
        raise RuntimeError(
            "Supabase package is not installed. Run: pip install supabase"
        )
    if not Config.SUPABASE_URL or not Config.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError(
            "Supabase URL and Service Role Key must be set for admin operations."
        )
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)
