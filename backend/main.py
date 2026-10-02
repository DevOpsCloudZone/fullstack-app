import os
import secrets
import hashlib
from contextlib import closing
from datetime import datetime, timedelta, timezone

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from psycopg.errors import UniqueViolation
from pwdlib import PasswordHash

load_dotenv()

app = FastAPI(
    title="TechCircle API",
    description="Backend API for TechCircle",
    version="1.1.0",
)

password_hasher = PasswordHash.recommended()

SESSION_COOKIE_NAME = "techcircle_session"
SESSION_DURATION = timedelta(days=7)

# Set COOKIE_SECURE=true after HTTPS is configured.
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def get_database_connection():
    """Connect to PostgreSQL using backend/.env."""
    required_variables = [
        "DB_HOST",
        "DB_PORT",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
    ]

    missing = [key for key in required_variables if not os.getenv(key)]
    if missing:
        raise RuntimeError(
            "Missing database configuration: " + ", ".join(missing)
        )

    return psycopg.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ["DB_PORT"]),
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        connect_timeout=5,
    )


def hash_session_token(token: str) -> str:
    """Hash the session token before storing it in PostgreSQL."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class RegisterRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    full_name: str
    email: EmailStr


class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


def initialize_database():
    """Create all required database tables in dependency order."""
    with closing(get_database_connection()) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS user_library (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,
                    item_id VARCHAR(255) NOT NULL,
                    item_type VARCHAR(50) NOT NULL,
                    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (user_id, item_id, item_type)
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,
                    token_hash VARCHAR(64) UNIQUE NOT NULL,
                    expires_at TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS
                idx_user_sessions_expires_at
                ON user_sessions (expires_at)
                """
            )

        connection.commit()


@app.on_event("startup")
def startup():
    initialize_database()


def create_session(user_id: int) -> str:
    """Create a random session and store only its hash."""
    token = secrets.token_urlsafe(32)
    token_hash = hash_session_token(token)
    expires_at = datetime.now(timezone.utc) + SESSION_DURATION

    with closing(get_database_connection()) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO user_sessions (user_id, token_hash, expires_at)
                VALUES (%s, %s, %s)
                """,
                (user_id, token_hash, expires_at),
            )

        connection.commit()

    return token


def get_authenticated_user(request: Request):
    """Validate the session cookie and retrieve its user."""
    token = request.cookies.get(SESSION_COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to continue.",
        )

    token_hash = hash_session_token(token)

    with closing(get_database_connection()) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.id, u.full_name, u.email
                FROM user_sessions AS s
                JOIN users AS u ON u.id = s.user_id
                WHERE s.token_hash = %s
                  AND s.expires_at > NOW()
                """,
                (token_hash,),
            )
            user = cursor.fetchone()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
        )

    return {
        "id": user[0],
        "full_name": user[1],
        "email": user[2],
    }


@app.get("/")
def root():
    return {
        "service": "TechCircle API",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "TechCircle Backend",
    }


@app.post(
    "/auth/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(payload: RegisterRequest):
    full_name = payload.full_name.strip()
    email = str(payload.email).strip().lower()

    if len(full_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please enter your full name.",
        )

    password_hash = password_hasher.hash(payload.password)

    try:
        with closing(get_database_connection()) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO users (full_name, email, password_hash)
                    VALUES (%s, %s, %s)
                    RETURNING id, full_name, email
                    """,
                    (full_name, email, password_hash),
                )
                user = cursor.fetchone()

            connection.commit()

        return RegisterResponse(
            message="Registration successful.",
            user_id=user[0],
            full_name=user[1],
            email=user[2],
        )

    except UniqueViolation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from None

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Registration is temporarily unavailable. Please try again.",
        ) from None


@app.post("/auth/login")
def login_user(payload: LoginRequest, response: Response):
    email = str(payload.email).strip().lower()

    try:
        with closing(get_database_connection()) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, full_name, email, password_hash
                    FROM users
                    WHERE email = %s
                    """,
                    (email,),
                )
                user = cursor.fetchone()

        if user is None or not password_hasher.verify(
            payload.password, user[3]
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        token = create_session(user[0])

        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=token,
            max_age=int(SESSION_DURATION.total_seconds()),
            httponly=True,
            secure=COOKIE_SECURE,
            samesite="lax",
            path="/",
        )

        return {
            "message": "Login successful.",
            "user": {
                "id": user[0],
                "full_name": user[1],
                "email": user[2],
            },
        }

    except HTTPException:
        raise

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Login is temporarily unavailable. Please try again.",
        ) from None


@app.get("/library")
def get_library(request: Request):
    user = get_authenticated_user(request)

    try:
        with closing(get_database_connection()) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, item_id, item_type, saved_at
                    FROM user_library
                    WHERE user_id = %s
                    ORDER BY saved_at DESC
                    """,
                    (user["id"],),
                )
                items = cursor.fetchall()

        return {
            "items": [
                {
                    "id": row[0],
                    "item_id": row[1],
                    "item_type": row[2],
                    "saved_at": row[3],
                }
                for row in items
            ]
        }

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not load your library right now.",
        ) from None


@app.post("/library")
def save_to_library(request: Request, payload: dict):
    user = get_authenticated_user(request)

    item_id = str(payload.get("item_id", "")).strip()
    item_type = str(payload.get("item_type", "")).strip()

    if not item_id or not item_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="item_id and item_type are required.",
        )

    try:
        with closing(get_database_connection()) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO user_library (user_id, item_id, item_type)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id, item_id, item_type) DO NOTHING
                    RETURNING id, item_id, item_type, saved_at
                    """,
                    (user["id"], item_id, item_type),
                )
                saved_item = cursor.fetchone()

            connection.commit()

        if saved_item is None:
            return {"message": "Item is already in your library."}

        return {
            "message": "Item saved to your library.",
            "item": {
                "id": saved_item[0],
                "item_id": saved_item[1],
                "item_type": saved_item[2],
                "saved_at": saved_item[3],
            },
        }

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not save this item right now.",
        ) from None


@app.delete("/library/{item_type}/{item_id}")
def remove_from_library(
    item_type: str,
    item_id: str,
    request: Request,
):
    user = get_authenticated_user(request)

    try:
        with closing(get_database_connection()) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    DELETE FROM user_library
                    WHERE user_id = %s
                      AND item_id = %s
                      AND item_type = %s
                    """,
                    (user["id"], item_id, item_type),
                )

            connection.commit()

        return {"message": "Item removed from your library."}

    except psycopg.Error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not remove this item right now.",
        ) from None


@app.get("/auth/me")
def get_current_user(request: Request):
    return {"user": get_authenticated_user(request)}


@app.post("/auth/logout")
def logout_user(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE_NAME)

    if token:
        token_hash = hash_session_token(token)

        try:
            with closing(get_database_connection()) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        DELETE FROM user_sessions
                        WHERE token_hash = %s
                        """,
                        (token_hash,),
                    )

                connection.commit()

        except psycopg.Error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not sign out right now. Please try again.",
            ) from None

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        secure=COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )

    return {"message": "Logout successful."}
