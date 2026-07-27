import { useState } from 'react'
import './Booking.css'

const TIMES = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM']

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function Booking() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
    setSelectedDay(null)
    setSelectedTime(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
    setSelectedDay(null)
    setSelectedTime(null)
  }

  return (
    <section id="book" className="booking">

      {/* Header */}
      <div className="booking-header">
        <span className="booking-label">Book a Lesson</span>
        <h2>Find a time that works for you</h2>
      </div>

      {/* Calendar panel */}
      <div className="booking-panel">

        {/* Calendar */}
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

        {/* Time slots */}
        <div className="time-slots">
          <p className="times-title">
            Available Times {selectedDay ? `— ${monthName.slice(0,3)} ${selectedDay}` : ''}
          </p>

          <div className="times-grid">
            {TIMES.map((time) => (
              <button
                key={time}
                className={`time-btn ${selectedTime === time ? 'selected' : ''}`}
                onClick={() => setSelectedTime(time)}
                disabled={!selectedDay}
              >
                {time}
              </button>
            ))}
          </div>

          {/* Confirmation */}
          {selectedDay && selectedTime && (
            <div className="booking-confirm">
              <p className="confirm-label">Selected</p>
              <p className="confirm-value">{monthName} {selectedDay}, {year} · {selectedTime}</p>
              <button className="confirm-btn">Continue to Book Now</button>
            </div>
          )}
        </div>

      </div>

    </section>
  )
}

export default Booking
