import os

import resend

from models import Booking, Coach

resend.api_key = os.environ["RESEND_API_KEY"]

# Resend's shared sandbox address — only delivers to the email on the Resend account itself.
# Swap for a verified domain address (e.g. bookings@thebowlinglab.com) once one is set up.
FROM_ADDRESS = "onboarding@resend.dev"


def _format_date(d) -> str:
    return d.strftime("%A, %B %-d, %Y")


def _format_time(t) -> str:
    return t.strftime("%-I:%M %p")


def _send(to: str | None, subject: str, html: str) -> None:
    if not to:
        return
    try:
        resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": to,
            "subject": subject,
            "html": html,
        })
    except Exception:
        # a flaky email API should never break a booking/cancellation that already succeeded
        pass


def send_booking_confirmation(coach: Coach, name, email, lesson_type, date, time) -> None:
    when = f"{_format_date(date)} at {_format_time(time)}"
    _send(
        email,
        f"Lesson Confirmed — {when}",
        f"""
        <p>Hi {name or 'there'},</p>
        <p>Your <strong>{lesson_type}</strong> lesson with {coach.name} is confirmed for
        <strong>{when}</strong>.</p>
        <p>See you on the lanes!</p>
        """,
    )


def send_booking_notification(coach: Coach, name, email, phone, lesson_type, date, time) -> None:
    when = f"{_format_date(date)} at {_format_time(time)}"
    _send(
        coach.email,
        f"New Booking — {when}",
        f"""
        <p>New lesson booked:</p>
        <ul>
          <li><strong>When:</strong> {when}</li>
          <li><strong>Type:</strong> {lesson_type}</li>
          <li><strong>Client:</strong> {name or 'Unnamed'}</li>
          <li><strong>Email:</strong> {email or '—'}</li>
          <li><strong>Phone:</strong> {phone or '—'}</li>
        </ul>
        """,
    )


def send_package_confirmation(coach: Coach, name, email, lesson_type, sessions) -> None:
    session_list = "".join(
        f"<li>{_format_date(s.date)} at {_format_time(s.time)}</li>" for s in sessions
    )
    _send(
        email,
        f"Package Confirmed — {lesson_type}",
        f"""
        <p>Hi {name or 'there'},</p>
        <p>Your <strong>{lesson_type}</strong> package with {coach.name} is confirmed for all 3 sessions:</p>
        <ul>{session_list}</ul>
        """,
    )


def send_package_notification(coach: Coach, name, email, phone, lesson_type, sessions) -> None:
    session_list = "".join(
        f"<li>{_format_date(s.date)} at {_format_time(s.time)}</li>" for s in sessions
    )
    _send(
        coach.email,
        f"New Package Booked — {lesson_type}",
        f"""
        <p>New package booked:</p>
        <ul>
          <li><strong>Type:</strong> {lesson_type}</li>
          <li><strong>Client:</strong> {name or 'Unnamed'}</li>
          <li><strong>Email:</strong> {email or '—'}</li>
          <li><strong>Phone:</strong> {phone or '—'}</li>
        </ul>
        <p>Sessions:</p>
        <ul>{session_list}</ul>
        """,
    )


def send_cancellation_notice(booking: Booking) -> None:
    when = f"{_format_date(booking.appointment_date)} at {_format_time(booking.appointment_time)}"
    _send(
        booking.email,
        f"Lesson Cancelled — {when}",
        f"""
        <p>Hi {booking.name or 'there'},</p>
        <p>Your <strong>{booking.lesson_type}</strong> lesson with {booking.coach.name} on
        <strong>{when}</strong> has been cancelled.</p>
        <p>Reach out if you'd like to rebook.</p>
        """,
    )
