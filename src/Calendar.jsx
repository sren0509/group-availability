import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns'
import { useRef, useState } from 'react'

export default function Calendar({ currentMonth, selectedDates, onDateClick, onDateRange, summaryData }) {
  const monthStart = startOfMonth(currentMonth)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(monthStart))
  })

  const [dragging, setDragging] = useState(false)
  const dragMode = useRef(null) // 'select' or 'deselect'

  const isSelected = (day) => selectedDates?.includes(format(day, 'yyyy-MM-dd'))

  function handlePointerDown(day, inMonth) {
    if (!inMonth) return
    setDragging(true)
    const key = format(day, 'yyyy-MM-dd')
    // If already selected, drag will deselect; otherwise drag will select
    dragMode.current = isSelected(day) ? 'deselect' : 'select'
    onDateClick?.(key, dragMode.current)
  }

  function handlePointerEnter(day, inMonth) {
    if (!dragging || !inMonth) return
    const key = format(day, 'yyyy-MM-dd')
    const alreadySelected = selectedDates?.includes(key)
    if (dragMode.current === 'select' && !alreadySelected) onDateClick?.(key, 'select')
    if (dragMode.current === 'deselect' && alreadySelected) onDateClick?.(key, 'deselect')
  }

  function handlePointerUp() {
    setDragging(false)
    dragMode.current = null
  }

  return (
    <div className="calendar" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      <div className="calendar-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="day-label">{d}</div>
        ))}
      </div>
      <div className="calendar-grid" style={{ touchAction: 'none' }}>
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, currentMonth)
          const summary = summaryData?.[key]
          const isBest = summary && summary.isBest

          return (
            <div
              key={key}
              className={[
                'day-cell',
                !inMonth && 'outside',
                isSelected(day) && 'selected',
                isToday(day) && 'today',
                isBest && 'best'
              ].filter(Boolean).join(' ')}
              onPointerDown={() => handlePointerDown(day, inMonth)}
              onPointerEnter={() => handlePointerEnter(day, inMonth)}
            >
              <span className="day-number">{format(day, 'd')}</span>
              {summary && inMonth && (
                <div className="summary-info">
                  <span className="count">{summary.count}</span>
                  <div className="names">{summary.names.join(', ')}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
