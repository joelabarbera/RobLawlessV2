import './Booking.css'
import api from '../api.js'
import { useState, useEffect } from 'react'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const PACKAGE_SESSIONS_REQUIRED = 3
const PACKAGE_PREFIX = 'package:'
const PACKAGE_OPTIONS = [
  { lessonType: 'Beginner Fundamentals', price: 195 },
  { lessonType: 'Performance Coaching', price: 255 },
  { lessonType: 'Video Game Review', price: 135 },
]

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
  const [coaches, setCoaches] = useState([])
  const [selectedCoach, setSelectedCoach] = useState(null)
  const [packageSessions, setPackageSessions] = useState([])
  const [packageLessonType, setPackageLessonType] = useState('')

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await api.get('/coaches')
        const list = response.data.coaches || []
        setCoaches(list)
        if (list.length > 0) setSelectedCoach(list[0])
      } catch (error) {
        console.error('Error fetching coaches', error)
      }
    }
    fetchCoaches()
  }, [])

  useEffect(() => {
    if (!selectedDay || !selectedCoach) return
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    const fetchSlots = async () => {
      try {
        const response = await api.get(`/available_times?date=${dateStr}&coach_id=${selectedCoach.id}`)
        setSlots(response.data.slots || [])
      } catch (error) {
        console.error('Error fetching slots', error)
      }
    }
    fetchSlots()
  }, [selectedDay, month, year, selectedCoach])

  const chooseCoach = (coachId) => {
    const coach = coaches.find(c => c.id === Number(coachId))
    setSelectedCoach(coach)
    setSelectedDay(null)
    setSelectedTime(null)
    setSlots([])
  }

  const currentDateStr = () =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`

  const bookLesson = async (e) => {
    e.preventDefault()

    if (lessonType.startsWith(PACKAGE_PREFIX)) {
      setPackageLessonType(lessonType.slice(PACKAGE_PREFIX.length))
      setPackageSessions([{ date: currentDateStr(), time: selectedTime }])
      setSelectedDay(null)
      setSelectedTime(null)
      setSlots([])
      setStep('calendar')
      return
    }

    try {
      await api.post('/booking', { date: currentDateStr(), time: selectedTime, coach_id: selectedCoach.id, name, email, phone, lesson_type: lessonType })
      setStep('confirmed')
    } catch (error) {
      console.error('Error booking lesson', error)
    }
  }

  const submitPackage = async (sessions) => {
    try {
      await api.post('/packages', { coach_id: selectedCoach.id, lesson_type: packageLessonType, name, email, phone, sessions })
      setStep('confirmed')
    } catch (error) {
      console.error('Error booking package', error)
    }
  }

  const confirmCalendarSelection = () => {
    if (packageSessions.length === 0) {
      setStep('form')
      return
    }

    const updatedSessions = [...packageSessions, { date: currentDateStr(), time: selectedTime }]
    setSelectedDay(null)
    setSelectedTime(null)
    setSlots([])

    if (updatedSessions.length < PACKAGE_SESSIONS_REQUIRED) {
      setPackageSessions(updatedSessions)
    } else {
      setPackageSessions(updatedSessions)
      submitPackage(updatedSessions)
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
            {coaches.length > 1 && packageSessions.length === 0 && (
              <div className="form-group coach-select-row">
                <label className="form-label" htmlFor="coach-select">Choose a coach</label>
                <select
                  id="coach-select"
                  className="form-select"
                  value={selectedCoach?.id || ''}
                  onChange={e => chooseCoach(e.target.value)}
                >
                  {coaches.map(coach => (
                    <option key={coach.id} value={coach.id}>{coach.name}</option>
                  ))}
                </select>
              </div>
            )}
            {packageSessions.length > 0 && (
              <div className="package-progress">
                <p className="confirm-label">
                  {packageLessonType} Package with {selectedCoach?.name} — Session {packageSessions.length + 1} of {PACKAGE_SESSIONS_REQUIRED}
                </p>
                <ul className="package-session-list">
                  {packageSessions.map((s, i) => (
                    <li key={i}>Session {i + 1}: {s.date} at {formatTime(s.time)}</li>
                  ))}
                </ul>
              </div>
            )}
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
                <button className="confirm-btn" onClick={confirmCalendarSelection}>
                  {packageSessions.length === 0
                    ? 'Continue to Book Now'
                    : packageSessions.length + 1 < PACKAGE_SESSIONS_REQUIRED
                      ? `Confirm Session ${packageSessions.length + 1}`
                      : 'Confirm Package'}
                </button>
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
                <optgroup label="Packages">
                  {PACKAGE_OPTIONS.map(opt => (
                    <option key={opt.lessonType} value={`${PACKAGE_PREFIX}${opt.lessonType}`}>
                      3x {opt.lessonType} — ${opt.price}
                    </option>
                  ))}
                </optgroup>
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
          {packageSessions.length === PACKAGE_SESSIONS_REQUIRED ? (
            <>
              <p className="confirmed-lesson">{packageLessonType} — 3-Lesson Package</p>
              <ul className="package-session-list">
                {packageSessions.map((s, i) => (
                  <li key={i}>Session {i + 1}: {s.date} at {formatTime(s.time)}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="confirm-value">{monthName} {selectedDay}, {year} · {formatTime(selectedTime)}</p>
              <p className="confirmed-lesson">{lessonType}</p>
            </>
          )}
          <p className="confirmed-message">{selectedCoach?.name || 'Your coach'} will be in touch shortly to confirm your lesson details.</p>
        </div>
      )}

    </section>
  )
}

export default Booking
