import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

import psycopg
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pwdlib import PasswordHash


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Configuration
# --------------------------------------------------

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "techcircle")
DB_USER = os.getenv("DB_USER", "techcircle_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

COOKIE_NAME = "techcircle_session"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"

SESSION_DAYS = 7

password_hash = PasswordHash.recommended()


# --------------------------------------------------
# Database connection
# --------------------------------------------------

def get_db_connection():
    return psycopg.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )


# --------------------------------------------------
# Request models
# --------------------------------------------------

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LibraryRequest(BaseModel):
    item_id: str
    item_type: str


# --------------------------------------------------
# Session helpers
# --------------------------------------------------

def create_session(user_id: int) -> str:
    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO user_sessions
                    (user_id, token_hash, expires_at)
                VALUES
                    (%s, %s, %s)
                """,
                (user_id, token_hash, expires_at),
            )
        conn.commit()

    return raw_token


def get_authenticated_user(request: Request):
    token = request.cookies.get(COOKIE_NAME)

    if not token:
        return None

    token_hash = hashlib.sha256(token.encode()).hexdigest()

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    u.id,
                    u.full_name,
                    u.email
                FROM user_sessions s
                JOIN users u
                    ON u.id = s.user_id
                WHERE s.token_hash = %s
                  AND s.expires_at > NOW()
                """,
                (token_hash,),
            )

            user = cursor.fetchone()

    if not user:
        return None

    return {
        "id": user[0],
        "full_name": user[1],
        "email": user[2],
    }


def delete_session(request: Request):
    token = request.cookies.get(COOKIE_NAME)

    if not token:
        return

    token_hash = hashlib.sha256(token.encode()).hexdigest()

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM user_sessions
                WHERE token_hash = %s
                """,
                (token_hash,),
            )
        conn.commit()


# --------------------------------------------------
# Health
# --------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# --------------------------------------------------
# Authentication
# --------------------------------------------------

@app.post("/auth/register")
def register(data: RegisterRequest, response: Response):

    full_name = data.full_name.strip()
    email = str(data.email).strip().lower()

    if not full_name:
        raise HTTPException(
            status_code=400,
            detail="Full name is required",
        )

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters",
        )

    hashed_password = password_hash.hash(data.password)

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT id
                    FROM users
                    WHERE email = %s
                    """,
                    (email,),
                )

                existing_user = cursor.fetchone()

                if existing_user:
                    raise HTTPException(
                        status_code=400,
                        detail="Email already registered",
                    )

                cursor.execute(
                    """
                    INSERT INTO users
                        (full_name, email, password_hash)
                    VALUES
                        (%s, %s, %s)
                    RETURNING id
                    """,
                    (
                        full_name,
                        email,
                        hashed_password,
                    ),
                )

                user_id = cursor.fetchone()[0]

            conn.commit()

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to create account",
        )

    return {
        "message": "Account created",
        "user": {
            "id": user_id,
            "full_name": full_name,
            "email": email,
        },
    }


@app.post("/auth/login")
def login(data: LoginRequest, response: Response):

    email = str(data.email).strip().lower()

    with get_db_connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    full_name,
                    email,
                    password_hash
                FROM users
                WHERE email = %s
                """,
                (email,),
            )

            user = cursor.fetchone()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    user_id = user[0]
    full_name = user[1]
    user_email = user[2]
    stored_password_hash = user[3]

    try:
        valid_password = password_hash.verify(
            data.password,
            stored_password_hash,
        )
    except Exception:
        valid_password = False

    if not valid_password:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    session_token = create_session(user_id)

    response.set_cookie(
        key=COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=SESSION_DAYS * 24 * 60 * 60,
    )

    return {
        "message": "Login successful",
        "user": {
            "id": user_id,
            "full_name": full_name,
            "email": user_email,
        },
    }


@app.get("/auth/me")
def me(request: Request):

    user = get_authenticated_user(request)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    return {
        "user": user
    }


@app.post("/auth/logout")
def logout(request: Request, response: Response):

    delete_session(request)

    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )

    return {
        "message": "Logged out successfully"
    }


# --------------------------------------------------
# Library
# --------------------------------------------------

@app.get("/library")
def get_library(request: Request):

    user = get_authenticated_user(request)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    with get_db_connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    item_id,
                    item_type,
                    saved_at
                FROM user_library
                WHERE user_id = %s
                ORDER BY saved_at DESC
                """,
                (user["id"],),
            )

            rows = cursor.fetchall()

    return {
        "items": [
            {
                "item_id": row[0],
                "item_type": row[1],
                "saved_at": row[2],
            }
            for row in rows
        ]
    }


@app.post("/library")
def save_to_library(
    data: LibraryRequest,
    request: Request,
):

    user = get_authenticated_user(request)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    with get_db_connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                INSERT INTO user_library
                    (user_id, item_id, item_type)
                VALUES
                    (%s, %s, %s)
                ON CONFLICT
                    (user_id, item_id, item_type)
                DO NOTHING
                """,
                (
                    user["id"],
                    data.item_id,
                    data.item_type,
                ),
            )

        conn.commit()

    return {
        "message": "Item saved"
    }


@app.delete("/library/{item_type}/{item_id}")
def remove_from_library(
    item_type: str,
    item_id: str,
    request: Request,
):

    user = get_authenticated_user(request)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    with get_db_connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                DELETE FROM user_library
                WHERE user_id = %s
                  AND item_id = %s
                  AND item_type = %s
                """,
                (
                    user["id"],
                    item_id,
                    item_type,
                ),
            )

        conn.commit()

    return {
        "message": "Item removed"
    }
