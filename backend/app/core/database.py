import os
from sqlmodel import create_engine

# Read DATABASE_URL from environment if available (e.g. Render PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render provides postgres:// URLs, SQLAlchemy 1.4+ requires postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )
    DB_DIR = ""
    DB_PATH = ""
else:
    DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
    os.makedirs(DB_DIR, exist_ok=True)
    DB_PATH = os.path.join(DB_DIR, "users.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"

    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )

