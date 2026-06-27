import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns'

export default function Calendar({ currentMonth, selectedDates, onDateClick, summaryData }) {
  const monthStart = startOfMonth(currentMonth)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(monthStart))
  })

  const isSelected = (day) => selectedDates?.includes(format(day, 'yyyy-MM-dd'))

  return (
    <div className="calendar">
      <div className="calendar-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="day-label">{d}</div>
        ))}
      </div>
      <div className="calendar-grid">
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
              onClick={() => inMonth && onDateClick?.(key)}
            >
              <span className="day-number">{format(day, 'd')}</span>
              {summary && inMonth && (
                <div className="summary-info">
                  <span className="count">{summary.count} busy</span>
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
