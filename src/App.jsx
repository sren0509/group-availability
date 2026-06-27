import { useState, useEffect } from 'react'
import { addMonths, subMonths, format } from 'date-fns'
import Calendar from './Calendar'
import { supabase } from './supabase'
import './App.css'

export default function App() {
  const [name, setName] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState([])
  const [responses, setResponses] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { fetchResponses() }, [])

  async function fetchResponses() {
    const { data } = await supabase.from('responses').select('*')
    if (data) setResponses(data)
  }

  function toggleDate(dateKey) {
    setSelectedDates(prev =>
      prev.includes(dateKey) ? prev.filter(d => d !== dateKey) : [...prev, dateKey]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('responses').upsert(
      { name: name.trim(), unavailable_dates: selectedDates, updated_at: new Date().toISOString() },
      { onConflict: 'name' }
    )
    setSubmitting(false)
    if (error) { setMessage('Error saving. Try again.'); return }
    setMessage('Saved!')
    fetchResponses()
    setTimeout(() => setMessage(''), 3000)
  }

  // Build summary data
  const summaryData = {}
  responses.forEach(r => {
    (r.unavailable_dates || []).forEach(d => {
      if (!summaryData[d]) summaryData[d] = { count: 0, names: [] }
      summaryData[d].count++
      summaryData[d].names.push(r.name)
    })
  })
  const counts = Object.values(summaryData).map(s => s.count)
  const minCount = counts.length ? Math.min(...counts) : 0
  Object.values(summaryData).forEach(s => { s.isBest = s.count === minCount })

  return (
    <div className="app">
      <h1>📅 Group Availability</h1>
      <p className="subtitle">Mark dates you're <strong>unavailable</strong></p>

      <form onSubmit={handleSubmit} className="name-form">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? 'Saving...' : 'Submit'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}

      <div className="month-nav">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}>←</button>
        <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}>→</button>
      </div>

      <Calendar
        currentMonth={currentMonth}
        selectedDates={selectedDates}
        onDateClick={toggleDate}
        summaryData={responses.length ? summaryData : null}
      />

      {responses.length > 0 && (
        <div className="legend">
          <span className="legend-item"><span className="dot selected-dot"></span> Your selection</span>
          <span className="legend-item"><span className="dot best-dot"></span> Best dates (fewest busy)</span>
        </div>
      )}
    </div>
  )
}
