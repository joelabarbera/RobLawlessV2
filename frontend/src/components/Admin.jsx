import './Admin.css'
import api, { API_BASE_URL } from '../api.js'
import { useState, useEffect } from 'react'

// Change this password before going live
const ADMIN_PASSWORD = 'coach1600'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 || 12
  return `${display}:${m} ${ampm}`
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('default', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function Admin() {
  const [authenticated, setAuthenticated] = useState(
    sessionStorage.getItem('admin_auth') === 'true'
  )
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  const [mode, setMode] = useState('weekly')
  const [schedules, setSchedules] = useState([])
  const [bookings, setBookings] = useState([])
  const [coaches, setCoaches] = useState([])
  const [selectedCoachId, setSelectedCoachId] = useState(null)

  // Weekly form state
  const [selectedDays, setSelectedDays] = useState([])
  const [startTime, setStartTime] = useState('11:00')
  const [endTime, setEndTime] = useState('21:00')
  const [startDate, setStartDate] = useState('')
  const [weeks, setWeeks] = useState(1)

  // Single day form state
  const [singleDate, setSingleDate] = useState('')
  const [singleStart, setSingleStart] = useState('11:00')
  const [singleEnd, setSingleEnd] = useState('21:00')

  useEffect(() => {
    if (authenticated) fetchCoaches()
  }, [authenticated])

  useEffect(() => {
    if (selectedCoachId) {
      fetchSchedules()
      fetchBookings()
    }
  }, [selectedCoachId])

  const fetchCoaches = async () => {
    try {
      const res = await api.get('/coaches')
      const list = res.data.coaches || []
      setCoaches(list)
      if (list.length > 0) setSelectedCoachId(list[0].id)
    } catch (err) {
      console.error('Error fetching coaches', err)
    }
  }

  const fetchSchedules = async () => {
    try {
      const res = await api.get(`/admin/schedules?coach_id=${selectedCoachId}`)
      setSchedules(res.data.schedules)
    } catch (err) {
      console.error('Error fetching schedules', err)
    }
  }

  const fetchBookings = async () => {
    try {
      const res = await api.get(`/bookings?coach_id=${selectedCoachId}&upcoming=true`)
      setBookings(res.data.bookings)
    } catch (err) {
      console.error('Error fetching bookings', err)
    }
  }

  const cancelBooking = async (booking) => {
    const label = `${formatDate(booking.appointment_date)} at ${formatTime(booking.appointment_time)}`
    if (!window.confirm(`Cancel the appointment on ${label}${booking.name ? ` with ${booking.name}` : ''}? This also removes it from Google Calendar.`)) {
      return
    }
    try {
      await api.delete(`/admin/bookings/${booking.id}`)
      await fetchBookings()
    } catch (err) {
      console.error('Error cancelling booking', err)
    }
  }

  const connectGoogleCalendar = () => {
    window.location.href = `${API_BASE_URL}/auth/google?coach_id=${selectedCoachId}`
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthenticated(true)
      sessionStorage.setItem('admin_auth', 'true')
    } else {
      setPasswordError(true)
    }
  }

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const addSchedule = async (e) => {
    e.preventDefault()
    const payload = mode === 'weekly'
      ? { coach_id: selectedCoachId, type: 'weekly', days: selectedDays, start_time: startTime, end_time: endTime, start_date: startDate, weeks: Number(weeks) }
      : { coach_id: selectedCoachId, type: 'single', date: singleDate, start_time: singleStart, end_time: singleEnd }
    try {
      await api.post('/admin/schedules', payload)
      await fetchSchedules()
      if (mode === 'weekly') { setSelectedDays([]); setStartDate(''); setWeeks(1) }
      else { setSingleDate('') }
    } catch (err) {
      console.error('Error adding schedule', err)
    }
  }

  const deleteSchedule = async (id) => {
    try {
      await api.delete(`/admin/schedules/${id}`)
      await fetchSchedules()
    } catch (err) {
      console.error('Error deleting schedule', err)
    }
  }

  const selectedCoach = coaches.find(c => c.id === selectedCoachId)

  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <span className="admin-label">The Bowling Lab</span>
          <h2>Admin Access</h2>
          <form onSubmit={handleLogin}>
            <input
              className="admin-input"
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(false) }}
            />
            {passwordError && <p className="admin-error">Incorrect password</p>}
            <button type="submit" className="admin-btn">Sign In</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <span className="admin-label">The Bowling Lab</span>
        <h1>Schedule Manager</h1>
      </div>

      {coaches.length > 1 && (
        <div className="coach-switcher">
          {coaches.map(coach => (
            <button
              key={coach.id}
              className={`mode-btn ${selectedCoachId === coach.id ? 'active' : ''}`}
              onClick={() => setSelectedCoachId(coach.id)}
            >
              {coach.name}
            </button>
          ))}
        </div>
      )}

      {selectedCoach && (
        <div className="calendar-connect">
          <div className="calendar-connect-info">
            <p className="schedule-title">{selectedCoach.name}'s Google Calendar</p>
            <p className={`schedule-detail ${selectedCoach.connected ? 'connected' : ''}`}>
              {selectedCoach.connected ? 'Connected' : 'Not connected'}
            </p>
          </div>
          <button className="admin-btn calendar-connect-btn" onClick={connectGoogleCalendar}>
            {selectedCoach.connected ? 'Reconnect' : 'Connect Google Calendar'}
          </button>
        </div>
      )}

      <div className="admin-content">

        {/* Add Schedule Card */}
        <div className="admin-card">
          <h3>Add Availability</h3>

          <div className="mode-toggle">
            <button className={`mode-btn ${mode === 'weekly' ? 'active' : ''}`} onClick={() => setMode('weekly')}>
              Weekly Block
            </button>
            <button className={`mode-btn ${mode === 'single' ? 'active' : ''}`} onClick={() => setMode('single')}>
              Single Day
            </button>
          </div>

          <form className="admin-form" onSubmit={addSchedule}>
            {mode === 'weekly' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Days</label>
                  <div className="day-checkboxes">
                    {DAYS_OF_WEEK.map(day => (
                      <label
                        key={day}
                        className={`day-check ${selectedDays.includes(day) ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(day)}
                          onChange={() => toggleDay(day)}
                        />
                        {day.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input className="admin-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input className="admin-input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="admin-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (weeks)</label>
                    <input className="admin-input" type="number" min="1" max="52" value={weeks} onChange={e => setWeeks(e.target.value)} required />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="admin-input" type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input className="admin-input" type="time" value={singleStart} onChange={e => setSingleStart(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input className="admin-input" type="time" value={singleEnd} onChange={e => setSingleEnd(e.target.value)} required />
                  </div>
                </div>
              </>
            )}
            <button type="submit" className="admin-btn">Add Schedule</button>
          </form>
        </div>

        {/* Active Schedules Card */}
        <div className="admin-card">
          <h3>Active Schedules</h3>
          {schedules.length === 0 ? (
            <p className="admin-empty">No schedules added yet.</p>
          ) : (
            <div className="schedule-list">
              {schedules.map(s => (
                <div key={s.id} className="schedule-item">
                  <div className="schedule-info">
                    {s.type === 'weekly' ? (
                      <>
                        <p className="schedule-title">{s.days.join(', ')}</p>
                        <p className="schedule-detail">
                          {s.start_time} – {s.end_time} · {s.weeks} week{s.weeks > 1 ? 's' : ''} from {s.start_date}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="schedule-title">{s.date}</p>
                        <p className="schedule-detail">{s.start_time} – {s.end_time}</p>
                      </>
                    )}
                  </div>
                  <button className="delete-btn" onClick={() => deleteSchedule(s.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments Card */}
        <div className="admin-card admin-card-wide">
          <h3>Upcoming Appointments{selectedCoach ? ` — ${selectedCoach.name}` : ''}</h3>
          {bookings.length === 0 ? (
            <p className="admin-empty">No upcoming appointments.</p>
          ) : (
            <div className="booking-list">
              {bookings.map(b => (
                <div key={b.id} className="schedule-item">
                  <div className="schedule-info">
                    <p className="schedule-title">{formatDate(b.appointment_date)} · {formatTime(b.appointment_time)}</p>
                    <p className="schedule-detail">
                      {b.name || 'Unnamed'}{b.lesson_type ? ` — ${b.lesson_type}` : ''}
                      {b.package_id ? ' (package)' : ''}
                    </p>
                    {(b.email || b.phone) && (
                      <p className="schedule-detail">{[b.email, b.phone].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <button className="delete-btn" onClick={() => cancelBooking(b)}>Cancel</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Admin
