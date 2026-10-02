import os
import uvicorn
from datetime import date as DateType, time as TimeType, datetime, timedelta
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import emails
import google_auth
from google_auth import get_calendar_service
from database import Base, engine, get_db
from models import Booking, Coach, Package, Schedule

PACKAGE_PRICES = {
    "Beginner Fundamentals": 195,
    "Performance Coaching": 255,
    "Video Game Review": 135,
}


class Book_Lesson(BaseModel):
    appointment_date: DateType = Field(..., alias="date")
    appointment_time: TimeType = Field(..., alias="time")
    coach_id: int | None = None
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    lesson_type: str | None = None

class ScheduleBlock(BaseModel):
    coach_id: int | None = None
    type: str
    days: list[str] | None = None
    start_time: str
    end_time: str
    start_date: str | None = None
    weeks: int | None = None
    date: str | None = None

class SessionSlot(BaseModel):
    date: DateType
    time: TimeType

class PackageBooking(BaseModel):
    coach_id: int | None = None
    lesson_type: str
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    sessions: list[SessionSlot]


app = FastAPI()

origins = os.environ.get("FRONTEND_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(google_auth.router)

Base.metadata.create_all(bind=engine)


# --- Helpers ---

# until the frontend has a coach picker, everything falls back to Rob
def get_default_coach(db: Session) -> Coach:
    coach = db.query(Coach).order_by(Coach.id).first()
    if not coach:
        raise HTTPException(status_code=500, detail="No coach configured")
    return coach

# resolves the requested coach, or falls back to the default when none was given
def resolve_coach(db: Session, coach_id: int | None) -> Coach:
    if coach_id is None:
        return get_default_coach(db)
    coach = db.query(Coach).filter(Coach.id == coach_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    return coach

def serialize_coach(c: Coach) -> dict:
    return {"id": c.id, "name": c.name, "connected": c.google_token is not None}

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
def covers_date(schedule: Schedule, target: DateType) -> bool:
    if schedule.type == "single":
        return schedule.date == str(target)
    if schedule.type == "weekly":
        if target.strftime("%A") not in (schedule.days or []):
            return False
        start = DateType.fromisoformat(schedule.start_date)
        end = start + timedelta(weeks=schedule.weeks)
        return start <= target < end
    return False

# returns which times are already booked on a given date, blocks the full 1hr window
def get_booked_times(db: Session, coach_id: int, target: DateType) -> set:
    booked = set()
    bookings = db.query(Booking).filter(
        Booking.coach_id == coach_id,
        Booking.appointment_date == target,
    ).all()
    for lesson in bookings:
        t = lesson.appointment_time
        start_minutes = t.hour * 60 + t.minute
        for offset in range(0, 60, 30):
            blocked = start_minutes + offset
            booked.add(f"{blocked // 60:02d}:{blocked % 60:02d}")
    return booked

def serialize_schedule(s: Schedule) -> dict:
    return {
        "id": s.id,
        "type": s.type,
        "days": s.days,
        "start_time": s.start_time,
        "end_time": s.end_time,
        "start_date": s.start_date,
        "weeks": s.weeks,
        "date": s.date,
    }

def serialize_booking(b: Booking) -> dict:
    return {
        "id": b.id,
        "appointment_date": b.appointment_date,
        "appointment_time": b.appointment_time,
        "name": b.name,
        "email": b.email,
        "phone": b.phone,
        "lesson_type": b.lesson_type,
        "package_id": b.package_id,
    }

# builds a google calendar event body for a single lesson slot
def build_calendar_event(lesson_type: str, name: str | None, email: str | None, phone: str | None, date: DateType, time: TimeType) -> dict:
    date_str = str(date)
    start = f"{date_str}T{time.strftime('%H:%M:%S')}"
    end_hour = (time.hour + 1) % 24
    end = f"{date_str}T{end_hour:02d}:{time.minute:02d}:00"

    return {
        'summary': f"{lesson_type or 'Bowling Lesson'} — {name or 'Client'}",
        'description': f"Lesson: {lesson_type}\nEmail: {email}\nPhone: {phone}",
        'start': {'dateTime': start, 'timeZone': 'America/New_York'},
        'end':   {'dateTime': end,   'timeZone': 'America/New_York'},
    }


# --- Coaches ---

# lists active coaches for the booking page / admin picker
@app.get("/coaches")
def list_coaches(db: Session = Depends(get_db)):
    coaches = db.query(Coach).filter(Coach.active == True).order_by(Coach.id).all()
    return {"coaches": [serialize_coach(c) for c in coaches]}


# --- Available times ---

# client picks a date, figures out what slots are open and which are taken
@app.get("/available_times")
def get_times(date: str = Query(None), coach_id: int | None = Query(None), db: Session = Depends(get_db)):
    if not date:
        return {"slots": []}
    try:
        target = DateType.fromisoformat(date)
    except ValueError:
        return {"slots": []}

    coach = resolve_coach(db, coach_id)

    all_slots: set[str] = set()
    schedules = db.query(Schedule).filter(Schedule.coach_id == coach.id).all()
    for schedule in schedules:
        if covers_date(schedule, target):
            all_slots.update(generate_slots(schedule.start_time, schedule.end_time))

    booked = get_booked_times(db, coach.id, target)

    return {
        "slots": [
            {"time": slot, "booked": slot in booked}
            for slot in sorted(all_slots)
        ]
    }


# --- Admin schedule endpoints ---

# returns all the schedules rob has set up
@app.get("/admin/schedules")
def get_schedules(coach_id: int | None = Query(None), db: Session = Depends(get_db)):
    coach = resolve_coach(db, coach_id)
    schedules = db.query(Schedule).filter(Schedule.coach_id == coach.id).all()
    return {"schedules": [serialize_schedule(s) for s in schedules]}

# rob adds a new availability block from the admin page
@app.post("/admin/schedules")
def add_schedule(block: ScheduleBlock, db: Session = Depends(get_db)):
    coach = resolve_coach(db, block.coach_id)
    schedule = Schedule(coach_id=coach.id, **block.model_dump(exclude={"coach_id"}))
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return {"message": "Schedule added", "schedule": serialize_schedule(schedule)}

# rob removes a schedule block he no longer needs
@app.delete("/admin/schedules/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db.query(Schedule).filter(Schedule.id == schedule_id).delete()
    db.commit()
    return {"message": "Schedule removed"}


# --- Booking ---

# saves the booking and creates the event on the coach's google calendar
@app.post("/booking")
def book_lesson(lesson: Book_Lesson, db: Session = Depends(get_db)):
    coach = resolve_coach(db, lesson.coach_id)

    event = build_calendar_event(lesson.lesson_type, lesson.name, lesson.email, lesson.phone, lesson.appointment_date, lesson.appointment_time)

    service = get_calendar_service(coach)
    created_event = service.events().insert(calendarId='primary', body=event).execute()

    booking = Booking(
        coach_id=coach.id,
        appointment_date=lesson.appointment_date,
        appointment_time=lesson.appointment_time,
        name=lesson.name,
        email=lesson.email,
        phone=lesson.phone,
        lesson_type=lesson.lesson_type,
        google_event_id=created_event.get("id"),
    )
    db.add(booking)
    db.commit()

    emails.send_booking_confirmation(coach, lesson.name, lesson.email, lesson.lesson_type, lesson.appointment_date, lesson.appointment_time)
    emails.send_booking_notification(coach, lesson.name, lesson.email, lesson.phone, lesson.lesson_type, lesson.appointment_date, lesson.appointment_time)

    return {"message": f"Booking confirmed for {lesson.appointment_date} at {lesson.appointment_time}"}

# lists a coach's bookings, optionally restricted to today-and-later, oldest first
@app.get("/bookings")
def get_bookings(coach_id: int | None = Query(None), upcoming: bool = Query(False), db: Session = Depends(get_db)):
    coach = resolve_coach(db, coach_id)
    query = db.query(Booking).filter(Booking.coach_id == coach.id)
    if upcoming:
        query = query.filter(Booking.appointment_date >= DateType.today())
    bookings = query.order_by(Booking.appointment_date, Booking.appointment_time).all()
    return {"bookings": [serialize_booking(b) for b in bookings]}

# admin cancels a booking: best-effort remove the Google Calendar event, always remove the DB row
@app.delete("/admin/bookings/{booking_id}")
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.google_event_id and booking.coach.google_token:
        try:
            service = get_calendar_service(booking.coach)
            service.events().delete(calendarId='primary', eventId=booking.google_event_id).execute()
        except Exception:
            # event may already be gone from the calendar (e.g. deleted manually) — DB cleanup still proceeds
            pass

    emails.send_cancellation_notice(booking)

    db.delete(booking)
    db.commit()
    return {"message": "Booking cancelled"}


# --- Packages ---

# books a 3-lesson package: one payment record, three linked bookings, three calendar events
@app.post("/packages")
def book_package(payload: PackageBooking, db: Session = Depends(get_db)):
    if len(payload.sessions) != 3:
        raise HTTPException(status_code=400, detail="A package must include exactly 3 sessions")
    if payload.lesson_type not in PACKAGE_PRICES:
        raise HTTPException(status_code=400, detail="Unknown package lesson type")

    coach = resolve_coach(db, payload.coach_id)
    service = get_calendar_service(coach)

    package = Package(
        coach_id=coach.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        lesson_type=payload.lesson_type,
        price=PACKAGE_PRICES[payload.lesson_type],
    )
    db.add(package)
    db.flush()

    for i, session in enumerate(payload.sessions, start=1):
        event = build_calendar_event(
            f"{payload.lesson_type} (Package Session {i} of 3)", payload.name, payload.email, payload.phone,
            session.date, session.time,
        )
        created_event = service.events().insert(calendarId='primary', body=event).execute()

        db.add(Booking(
            coach_id=coach.id,
            package_id=package.id,
            appointment_date=session.date,
            appointment_time=session.time,
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            lesson_type=payload.lesson_type,
            google_event_id=created_event.get("id"),
        ))

    db.commit()

    emails.send_package_confirmation(coach, payload.name, payload.email, payload.lesson_type, payload.sessions)
    emails.send_package_notification(coach, payload.name, payload.email, payload.phone, payload.lesson_type, payload.sessions)

    return {
        "message": "Package confirmed",
        "package_id": package.id,
        "sessions": [{"date": s.date, "time": s.time} for s in payload.sessions],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
