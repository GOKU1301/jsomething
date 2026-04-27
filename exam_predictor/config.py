"""
config.py – Loads environment variables for the exam_predictor service.
"""

import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
PORT: int = int(os.getenv("PORT", "5001"))

# Validate at startup
if not SUPABASE_URL or not SUPABASE_KEY:
    raise EnvironmentError("SUPABASE_URL and SUPABASE_KEY must be set in the .env file.")

if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY must be set in the .env file.")
