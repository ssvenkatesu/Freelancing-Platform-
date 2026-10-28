import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

class Settings:
    PROJECT_NAME: str = "MyFiverr SBERT Matching Service"
    MODEL_NAME: str = os.getenv("SBERT_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")

settings = Settings()
