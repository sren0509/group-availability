import { useState } from 'react'

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

export function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

const HEAT_COLORS = [
  { bg: "#5a7d6b", text: "#ffffff" },
  { bg: "#739e87", text: "#ffffff" },
  { bg: "#8fb89f", text: "#ffffff" },
  { bg: "#cfe0d8", text: "#2d4a3e" },
  { bg: "#eaeeec", text: "#708c80" },
]

function heatColor(unavailCount, total) {
  if (total === 0) return HEAT_COLORS[0]
  const ratio = unavailCount / total
  if (ratio === 0)   return HEAT_COLORS[0]
  if (ratio <= 0.33) return HEAT_COLORS[1]
  if (ratio <= 0.66) return HEAT_COLORS[2]
  if (ratio < 1)     return HEAT_COLORS[3]
  return HEAT_COLORS[4]
}

export default function CalendarGrid({ year, month, myUnavailable, heatmap, totalPeople, today, onDayMouseDown, onDayMouseEnter, responses }) {
  const [hoveredKey, setHoveredKey] = useState(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const daysInPrev = getDaysInMonth(year, month - 1 < 0 ? 11 : month - 1)

  const cells = []

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const prevMonth = month - 1 < 0 ? 11 : month - 1
    const prevYear = month - 1 < 0 ? year - 1 : year
    cells.push({ key: dateKey(prevYear, prevMonth, d), day: d, faded: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: dateKey(year, month, d), day: d, faded: false })
  }
  const remaining = (7 - (cells.length % 7)) % 7
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month + 1 > 11 ? 0 : month + 1
    const nextYear = month + 1 > 11 ? year + 1 : year
    cells.push({ key: dateKey(nextYear, nextMonth, d), day: d, faded: true })
  }

  function getAvailableNames(key) {
    if (!responses || responses.size === 0) return []
    return Array.from(responses.entries())
      .filter(([, unavailDates]) => !unavailDates.has(key))
      .map(([name]) => name)
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="text-center font-bold text-base mb-3 text-foreground">
        {MONTH_NAMES[month]} {year}
      </div>
      <div className="grid grid-cols-7">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">{d}</div>
        ))}
        {cells.map((cell) => {
          const isToday = cell.key === today && !cell.faded
          const isMyUnavail = myUnavailable.has(cell.key) && !cell.faded
          const count = (!cell.faded && heatmap.get(cell.key)) || 0
          const { bg, text } = cell.faded ? { bg: "", text: "" } : heatColor(count, totalPeople)
          const available = totalPeople - count
          const isHovered = hoveredKey === cell.key && !cell.faded && totalPeople > 0
          const availableNames = isHovered ? getAvailableNames(cell.key) : []
          const allAvailable = availableNames.length === totalPeople

          return (
            <div
              key={cell.key + cell.faded}
              onMouseDown={() => !cell.faded && onDayMouseDown(cell.key)}
              onMouseEnter={() => { if (!cell.faded) { onDayMouseEnter(cell.key); setHoveredKey(cell.key) } }}
              onMouseLeave={() => setHoveredKey(null)}
              className={[
                "relative h-10 md:h-14 flex flex-col items-start justify-between p-1 md:p-1.5 text-xs md:text-sm font-medium border border-border select-none transition-colors duration-200",
                cell.faded ? "text-muted-foreground/40 bg-background" : "cursor-pointer",
                isToday ? "ring-2 ring-[#3b3bf5] ring-inset" : "",
                isMyUnavail ? "ring-2 ring-[#95424E] ring-inset" : "",
              ].filter(Boolean).join(" ")}
              style={{ backgroundColor: cell.faded ? undefined : bg, color: cell.faded ? undefined : isMyUnavail ? "#af2634" : text }}
            >
              <span>{cell.day}</span>
              {!cell.faded && totalPeople > 0 && (
                <span className="text-[9px] font-semibold opacity-60 leading-none">
                  {available}/{totalPeople}
                </span>
              )}

              {/* Hover tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 pointer-events-none">
                  <div className="bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
                    {allAvailable
                      ? <span className="font-medium">All available</span>
                      : availableNames.length === 0
                        ? <span className="opacity-70">No one available</span>
                        : availableNames.map((name, i) => (
                            <span key={name}>{name}{i < availableNames.length - 1 ? ", " : ""}</span>
                          ))
                    }
                  </div>
                  <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
