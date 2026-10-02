import os

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlalchemy.orm import Session

from database import get_db
from models import Coach

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

router = APIRouter(prefix="/auth/google", tags=["Google OAuth"])

SCOPES = ["https://www.googleapis.com/auth/calendar"]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRET_FILE = os.path.join(BASE_DIR, "credentials.json")

REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")


@router.get("")
def start_google_auth(coach_id: int, db: Session = Depends(get_db)):
    coach = db.query(Coach).filter(Coach.id == coach_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found.")

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )

    response = RedirectResponse(authorization_url)
    response.set_cookie(
        key="google_oauth_state",
        value=state,
        httponly=True,
        samesite="lax",
    )
    response.set_cookie(
        key="google_oauth_code_verifier",
        value=flow.code_verifier,
        httponly=True,
        samesite="lax",
    )
    response.set_cookie(
        key="google_oauth_coach_id",
        value=str(coach_id),
        httponly=True,
        samesite="lax",
    )

    return response


@router.get("/callback")
def google_auth_callback(request: Request, db: Session = Depends(get_db)):
    state = request.cookies.get("google_oauth_state")
    code_verifier = request.cookies.get("google_oauth_code_verifier")
    coach_id = request.cookies.get("google_oauth_coach_id")

    if not state or not code_verifier or not coach_id:
        raise HTTPException(
            status_code=400,
            detail="Missing OAuth state, code verifier, or coach cookie.",
        )

    coach = db.query(Coach).filter(Coach.id == int(coach_id)).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found.")

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRET_FILE,
        scopes=SCOPES,
        state=state,
        redirect_uri=REDIRECT_URI,
        code_verifier=code_verifier,
    )

    flow.fetch_token(authorization_response=str(request.url))

    credentials = flow.credentials

    coach.google_token = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes,
    }
    db.commit()

    return {
        "message": f"Google Calendar connected for {coach.name}.",
        "refresh_token_received": credentials.refresh_token is not None,
    }


# loads a coach's saved google token and connects to the calendar api
def get_calendar_service(coach: Coach):
    if not coach.google_token:
        raise HTTPException(
            status_code=400,
            detail=f"{coach.name} has not connected Google Calendar yet.",
        )
    token_data = coach.google_token
    creds = Credentials(
        token=token_data["token"],
        refresh_token=token_data["refresh_token"],
        token_uri=token_data["token_uri"],
        client_id=token_data["client_id"],
        client_secret=token_data["client_secret"],
        scopes=token_data["scopes"],
    )
    return build("calendar", "v3", credentials=creds)
