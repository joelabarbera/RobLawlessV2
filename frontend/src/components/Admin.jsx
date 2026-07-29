import './Admin.css'
import api from '../api.js'
import { useState, useEffect } from 'react'

// Change this password before going live
const ADMIN_PASSWORD = 'coach1600'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function Admin() {
  const [authenticated, setAuthenticated] = useState(
    sessionStorage.getItem('admin_auth') === 'true'
  )
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  const [mode, setMode] = useState('weekly')
  const [schedules, setSchedules] = useState([])

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
    if (authenticated) fetchSchedules()
  }, [authenticated])

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/admin/schedules')
      setSchedules(res.data.schedules)
    } catch (err) {
      console.error('Error fetching schedules', err)
    }
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
      ? { type: 'weekly', days: selectedDays, start_time: startTime, end_time: endTime, start_date: startDate, weeks: Number(weeks) }
      : { type: 'single', date: singleDate, start_time: singleStart, end_time: singleEnd }
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

      </div>
    </div>
  )
}

export default Admin
