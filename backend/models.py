from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, Time
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import relationship

from database import Base


class Coach(Base):
    __tablename__ = "coaches"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    active = Column(Boolean, nullable=False, default=True)
    google_token = Column(JSONB, nullable=True)

    schedules = relationship("Schedule", back_populates="coach")
    bookings = relationship("Booking", back_populates="coach")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True)
    coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False)
    type = Column(String, nullable=False)
    days = Column(ARRAY(String), nullable=True)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    start_date = Column(String, nullable=True)
    weeks = Column(Integer, nullable=True)
    date = Column(String, nullable=True)

    coach = relationship("Coach", back_populates="schedules")


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True)
    coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    lesson_type = Column(String, nullable=False)
    price = Column(Integer, nullable=True)

    coach = relationship("Coach")
    bookings = relationship("Booking", back_populates="package")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True)
    coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=True)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    lesson_type = Column(String, nullable=True)
    google_event_id = Column(String, nullable=True)

    coach = relationship("Coach", back_populates="bookings")
    package = relationship("Package", back_populates="bookings")
