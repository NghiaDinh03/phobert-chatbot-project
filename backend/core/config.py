import os

class Settings:
    LOCALAI_URL: str = os.getenv("LOCALAI_URL", "http://localai:8080")
    DATA_PATH: str = os.getenv("DATA_PATH", "./data")

settings = Settings()
