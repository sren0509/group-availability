import { useState, useEffect } from 'react'
import { addMonths, subMonths, format } from 'date-fns'
import Calendar from './Calendar'
import { supabase } from './supabase'
import './App.css'

export default function App() {
  const [name, setName] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState('bimonthly')
  const nextMonth = addMonths(currentMonth, 1)
  const [selectedDates, setSelectedDates] = useState([])
  const [responses, setResponses] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { fetchResponses() }, [])

  // Auto-load previous selection when name is entered
  useEffect(() => {
    if (!name.trim()) { setSelectedDates([]); setLoaded(false); return }
    const existing = responses.find(r => r.name.toLowerCase() === name.trim().toLowerCase())
    if (existing) {
      setSelectedDates(existing.unavailable_dates || [])
      setLoaded(true)
    } else {
      if (loaded) setSelectedDates([])
      setLoaded(false)
    }
  }, [name, responses])

  async function fetchResponses() {
    const { data } = await supabase.from('responses').select('*')
    if (data) setResponses(data)
  }

  function handleDateClick(dateKey, mode) {
    setSelectedDates(prev => {
      if (mode === 'deselect') return prev.filter(d => d !== dateKey)
      if (mode === 'select') return prev.includes(dateKey) ? prev : [...prev, dateKey]
      // fallback toggle
      return prev.includes(dateKey) ? prev.filter(d => d !== dateKey) : [...prev, dateKey]
    })
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
    setMessage('✓ Saved!')
    fetchResponses()
    setTimeout(() => setMessage(''), 3000)
  }

  // Build summary
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
      <p className="subtitle">Mark dates you're <strong>unavailable</strong> (drag to multi-select)</p>

      <form onSubmit={handleSubmit} className="name-form">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? '...' : 'Save'}
        </button>
        {selectedDates.length > 0 && (
          <button type="button" className="clear-btn" onClick={() => setSelectedDates([])}>Clear</button>
        )}
      </form>
      {message && <p className="message">{message}</p>}
      {loaded && <p className="loaded-hint">Loaded your previous selection — edit and save again</p>}

      <div className="month-nav">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}>←</button>
        <h2>
          {format(currentMonth, 'MMMM yyyy')}
          {view === 'bimonthly' && <span> — {format(nextMonth, 'MMMM yyyy')}</span>}
        </h2>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}>→</button>
        <select className="view-select" value={view} onChange={e => setView(e.target.value)}>
          <option value="bimonthly">2 Months</option>
          <option value="monthly">1 Month</option>
        </select>
      </div>

      <div className={`calendars-wrapper${view === 'monthly' ? ' single-month' : ''}`}>
        <Calendar
          currentMonth={currentMonth}
          selectedDates={selectedDates}
          onDateClick={handleDateClick}
          summaryData={responses.length ? summaryData : null}
        />
        {view === 'bimonthly' && (
          <Calendar
            currentMonth={nextMonth}
            selectedDates={selectedDates}
            onDateClick={handleDateClick}
            summaryData={responses.length ? summaryData : null}
          />
        )}
      </div>

      {responses.length > 0 && (
        <div className="legend">
          <span className="legend-item"><span className="dot selected-dot"></span> Your unavailable</span>
          <span className="legend-item"><span className="dot best-dot"></span> Best dates</span>
          <span className="legend-item">{responses.length} responses</span>
        </div>
      )}
    </div>
  )
}
