import os
import json
import secrets
import hashlib
import base64
import uvicorn
from datetime import date as DateType, time as TimeType, datetime, timedelta
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

SCOPES = ['https://www.googleapis.com/auth/calendar']
CREDENTIALS_FILE = 'credentials.json'


class Book_Lesson(BaseModel):
    appointment_date: DateType = Field(..., alias="date")
    appointment_time: TimeType = Field(..., alias="time")
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    lesson_type: str | None = None

class ScheduleBlock(BaseModel):
    type: str
    days: list[str] | None = None
    start_time: str
    end_time: str
    start_date: str | None = None
    weeks: int | None = None
    date: str | None = None


app = FastAPI()

origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

memory_db = {
    "book_lesson": [],
    "schedules": [],
    "next_id": 1
}

auth_sessions = {}


# --- Helpers ---

# takes a start and end time, spits out every 30 min slot between them
def generate_slots(start_str: str, end_str: str) -> list[str]:
    slots = []
    current = datetime.strptime(start_str, "%H:%M")
    end = datetime.strptime(end_str, "%H:%M")
    while current < end:
        slots.append(current.strftime("%H:%M"))
        current += timedelta(minutes=30)
    return slots

# checks if a schedule block applies to the date the client picked
def covers_date(schedule: dict, target: DateType) -> bool:
    if schedule["type"] == "single":
        return schedule["date"] == str(target)
    if schedule["type"] == "weekly":
        if target.strftime("%A") not in schedule["days"]:
            return False
        start = DateType.fromisoformat(schedule["start_date"])
        end = start + timedelta(weeks=schedule["weeks"])
        return start <= target < end
    return False

# returns which times are already booked on a given date 
def get_booked_times(target: DateType) -> set:
    booked = set()
    for lesson in memory_db["book_lesson"]:
        if lesson.appointment_date == target:
            t = lesson.appointment_time
            booked.add(f"{t.hour:02d}:{t.minute:02d}")
    return booked


# --- Google OAuth ---

# sends rob to google to approve calendar access
@app.get("/auth/google")
def auth_google():
    flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE,
        scopes=SCOPES,
        redirect_uri='http://localhost:8000/auth/callback'
    )
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b'=').decode()
    auth_url, state = flow.authorization_url(
        prompt='consent',
        code_challenge=code_challenge,
        code_challenge_method='S256'
    )
    auth_sessions[state] = code_verifier
    return RedirectResponse(auth_url)

# google redirects here after approval, saves the token to use the calendar
@app.get("/auth/callback")
def auth_callback(code: str, state: str):
    code_verifier = auth_sessions.pop(state, None)
    flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE,
        scopes=SCOPES,
        redirect_uri='http://localhost:8000/auth/callback',
        state=state
    )
    flow.fetch_token(code=code, code_verifier=code_verifier)
    creds = flow.credentials
    with open('token.json', 'w') as f:
        json.dump({
            'token': creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri,
            'client_id': creds.client_id,
            'client_secret': creds.client_secret,
            'scopes': list(creds.scopes)
        }, f)
    return {"message": "Google Calendar connected! You can close this tab."}


# --- Available times ---

# client picks a date, figures out what slots are open and which are taken
@app.get("/available_times")
def get_times(date: str = Query(None)):
    if not date:
        return {"slots": []}
    try:
        target = DateType.fromisoformat(date)
    except ValueError:
        return {"slots": []}

    all_slots: set[str] = set()
    for schedule in memory_db["schedules"]:
        if covers_date(schedule, target):
            all_slots.update(generate_slots(schedule["start_time"], schedule["end_time"]))

    booked = get_booked_times(target)

    return {
        "slots": [
            {"time": slot, "booked": slot in booked}
            for slot in sorted(all_slots)
        ]
    }


# --- Admin schedule endpoints ---

# returns all the schedules rob has set up
@app.get("/admin/schedules")
def get_schedules():
    return {"schedules": memory_db["schedules"]}

# rob adds a new availability block from the admin page
@app.post("/admin/schedules")
def add_schedule(block: ScheduleBlock):
    schedule = block.model_dump()
    schedule["id"] = memory_db["next_id"]
    memory_db["next_id"] += 1
    memory_db["schedules"].append(schedule)
    return {"message": "Schedule added", "schedule": schedule}

# rob removes a schedule block he no longer needs
@app.delete("/admin/schedules/{schedule_id}")
def delete_schedule(schedule_id: int):
    memory_db["schedules"] = [
        s for s in memory_db["schedules"] if s["id"] != schedule_id
    ]
    return {"message": "Schedule removed"}


# --- Booking ---

# loads the saved google token and connects to the calendar api
def get_calendar_service():
    with open('token.json') as f:
        token_data = json.load(f)
    creds = Credentials(
        token=token_data['token'],
        refresh_token=token_data['refresh_token'],
        token_uri=token_data['token_uri'],
        client_id=token_data['client_id'],
        client_secret=token_data['client_secret'],
        scopes=token_data['scopes']
    )
    return build('calendar', 'v3', credentials=creds)

# saves the booking and creates the event on rob's google calendar
@app.post("/booking")
def book_lesson(lesson: Book_Lesson):
    memory_db["book_lesson"].append(lesson)

    date_str = str(lesson.appointment_date)
    t = lesson.appointment_time
    start = f"{date_str}T{t.strftime('%H:%M:%S')}"
    end_hour = (t.hour + 1) % 24
    end = f"{date_str}T{end_hour:02d}:{t.minute:02d}:00"

    event = {
        'summary': f"{lesson.lesson_type or 'Bowling Lesson'} — {lesson.name or 'Client'}",
        'description': f"Lesson: {lesson.lesson_type}\nEmail: {lesson.email}\nPhone: {lesson.phone}",
        'start': {'dateTime': start, 'timeZone': 'America/New_York'},
        'end':   {'dateTime': end,   'timeZone': 'America/New_York'},
    }

    service = get_calendar_service()
    service.events().insert(calendarId='primary', body=event).execute()

    return {"message": f"Booking confirmed for {lesson.appointment_date} at {lesson.appointment_time}"}

@app.get("/bookings")
def get_bookings():
    return {"bookings": [b.model_dump() for b in memory_db["book_lesson"]]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
