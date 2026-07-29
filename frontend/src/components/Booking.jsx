import './Booking.css'
import api from '../api.js'
import { useState, useEffect } from 'react'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 || 12
  return `${display}:${m} ${ampm}`
}

function Booking() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [slots, setSlots] = useState([])
  const [step, setStep] = useState('calendar')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [lessonType, setLessonType] = useState('')

  useEffect(() => {
    if (!selectedDay) return
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    const fetchSlots = async () => {
      try {
        const response = await api.get(`/available_times?date=${dateStr}`)
        setSlots(response.data.slots || [])
      } catch (error) {
        console.error('Error fetching slots', error)
      }
    }
    fetchSlots()
  }, [selectedDay, month, year])

  const bookLesson = async (e) => {
    e.preventDefault()
    try {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
      await api.post('/booking', { date, time: selectedTime, name, email, phone, lesson_type: lessonType })
      setStep('confirmed')
    } catch (error) {
      console.error('Error booking lesson', error)
    }
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
    setSelectedDay(null)
    setSelectedTime(null)
    setSlots([])
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
    setSelectedDay(null)
    setSelectedTime(null)
    setSlots([])
  }

  return (
    <section id="book" className="booking">

      <div className="booking-header">
        <span className="booking-label">Book a Lesson</span>
        <h2>Find a time that works for you</h2>
      </div>

      {/* Step 1: Calendar */}
      {step === 'calendar' && (
        <div className="booking-panel">
          <div className="calendar">
            <div className="calendar-nav">
              <button onClick={prevMonth}>&#8249;</button>
              <span>{monthName} {year}</span>
              <button onClick={nextMonth}>&#8250;</button>
            </div>
            <div className="calendar-grid">
              {DAYS.map((d, i) => (
                <div className="day-label" key={i}>{d}</div>
              ))}
              {Array(firstDay).fill(null).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const day = i + 1
                const isPast = year < today.getFullYear() ||
                  (year === today.getFullYear() && month < today.getMonth()) ||
                  (year === today.getFullYear() && month === today.getMonth() && day < today.getDate())
                return (
                  <button
                    key={day}
                    className={`calendar-day ${selectedDay === day ? 'selected' : ''} ${isPast ? 'past' : ''}`}
                    onClick={() => { if (!isPast) { setSelectedDay(day); setSelectedTime(null) } }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="time-slots">
            <p className="times-title">
              {selectedDay ? `Available Times — ${monthName.slice(0, 3)} ${selectedDay}` : 'Select a date'}
            </p>
            <div className="times-grid">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  className={`time-btn ${selectedTime === slot.time ? 'selected' : ''} ${slot.booked ? 'booked' : ''}`}
                  onClick={() => !slot.booked && setSelectedTime(slot.time)}
                  disabled={slot.booked}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
              {selectedDay && slots.length === 0 && (
                <p className="no-slots">No availability for this day.</p>
              )}
            </div>
            {selectedDay && selectedTime && (
              <div className="booking-confirm">
                <p className="confirm-label">Selected</p>
                <p className="confirm-value">{monthName} {selectedDay}, {year} · {formatTime(selectedTime)}</p>
                <button className="confirm-btn" onClick={() => setStep('form')}>Continue to Book Now</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Contact Form */}
      {step === 'form' && (
        <div className="booking-form-panel">
          <p className="confirm-label">Booking for</p>
          <p className="confirm-value">{monthName} {selectedDay}, {year} · {formatTime(selectedTime)}</p>

          <form className="booking-form" onSubmit={bookLesson}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                required
                placeholder="John Smith"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                required
                placeholder="john@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                type="tel"
                required
                placeholder="(555) 000-0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lesson Type</label>
              <select
                className="form-select"
                required
                value={lessonType}
                onChange={e => setLessonType(e.target.value)}
              >
                <option value="">Select a lesson...</option>
                <option value="Beginner Fundamentals">Beginner Fundamentals — $65 / 60 min</option>
                <option value="Performance Coaching">Performance Coaching — $85 / 60 min</option>
                <option value="Video Game Review">Video Game Review — $45 / session</option>
              </select>
            </div>
            <button type="submit" className="confirm-btn">Confirm Booking</button>
          </form>

          <button className="back-btn" onClick={() => setStep('calendar')}>← Back</button>
        </div>
      )}

      {/* Step 3: Confirmed */}
      {step === 'confirmed' && (
        <div className="booking-form-panel booking-confirmed">
          <div className="confirmed-check">✓</div>
          <h3 className="confirmed-title">You're Booked!</h3>
          <p className="confirm-value">{monthName} {selectedDay}, {year} · {formatTime(selectedTime)}</p>
          <p className="confirmed-lesson">{lessonType}</p>
          <p className="confirmed-message">Rob will be in touch shortly to confirm your lesson details.</p>
        </div>
      )}

    </section>
  )
}

export default Booking
