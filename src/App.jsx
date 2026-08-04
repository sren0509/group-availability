import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react'
import CalendarGrid, { dateKey } from './CalendarGrid'
import Whiteboard from './Whiteboard'
import { supabase } from './supabase'

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const MONTH_COUNT_OPTIONS = [1, 2, 3]

export default function App() {
  const today = new Date()
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate())

  const [nameInput, setNameInput] = useState("")
  const [nameError, setNameError] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [activeName, setActiveName] = useState("")

  const [startYear, setStartYear] = useState(today.getFullYear())
  const [startMonth, setStartMonth] = useState(today.getMonth())
  const [monthCount, setMonthCount] = useState(2)
  const [showMonthMenu, setShowMonthMenu] = useState(false)

  const [responses, setResponses] = useState(new Map())
  const [unavailable, setUnavailable] = useState(new Set())
  const dragging = useRef(false)
  const dragMode = useRef("add")
  const draggedKeys = useRef(new Set())
  const saveTimeout = useRef(null)

  useEffect(() => { fetchAllResponses() }, [])

  async function fetchAllResponses() {
    const { data } = await supabase.from('responses').select('*')
    if (data) {
      const map = new Map()
      data.forEach(r => map.set(r.name, new Set(r.unavailable_dates || [])))
      setResponses(map)
    }
  }

  useEffect(() => {
    const up = () => { dragging.current = false; draggedKeys.current = new Set() }
    window.addEventListener("mouseup", up)
    return () => window.removeEventListener("mouseup", up)
  }, [])

  const heatmap = new Map()
  responses.forEach((dates) => dates.forEach((d) => heatmap.set(d, (heatmap.get(d) || 0) + 1)))
  const totalPeople = responses.size

  const handleSave = () => {
    const n = nameInput.trim()
    if (!n) { setNameError(true); return }
    setNameError(false)
    setActiveName(n)
    setNameSaved(true)
    const existing = responses.get(n)
    setUnavailable(existing ? new Set(existing) : new Set())
    setTimeout(() => setNameSaved(false), 2000)
  }

  const saveResponse = (next) => {
    setResponses(prev => {
      const updated = new Map(prev)
      updated.set(activeName, new Set(next))
      return updated
    })
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      await supabase.from('responses').upsert(
        { name: activeName, unavailable_dates: [...next], updated_at: new Date().toISOString() },
        { onConflict: 'name' }
      )
    }, 500)
  }

  const handleDayMouseDown = useCallback((key) => {
    dragging.current = true
    draggedKeys.current = new Set([key])
    const next = new Set(unavailable)
    if (next.has(key)) { dragMode.current = "remove"; next.delete(key) }
    else { dragMode.current = "add"; next.add(key) }
    setUnavailable(next)
    saveResponse(next)
  }, [unavailable, activeName])

  const handleDayMouseEnter = useCallback((key) => {
    if (!dragging.current || draggedKeys.current.has(key)) return
    draggedKeys.current.add(key)
    const next = new Set(unavailable)
    if (dragMode.current === "add") next.add(key)
    else next.delete(key)
    setUnavailable(next)
    saveResponse(next)
  }, [unavailable, activeName])

  const prevMonths = () => {
    let m = startMonth - monthCount
    let y = startYear
    while (m < 0) { m += 12; y -= 1 }
    setStartYear(y); setStartMonth(m)
  }

  const nextMonths = () => {
    let m = startMonth + monthCount
    let y = startYear
    while (m > 11) { m -= 12; y += 1 }
    setStartYear(y); setStartMonth(m)
  }

  const months = []
  for (let i = 0; i < monthCount; i++) {
    let m = startMonth + i
    let y = startYear
    while (m > 11) { m -= 12; y += 1 }
    months.push({ year: y, month: m })
  }

  const rangeLabel = monthCount === 1
    ? `${MONTH_NAMES[months[0].month]} ${months[0].year}`
    : `${MONTH_NAMES[months[0].month]} ${months[0].year} — ${MONTH_NAMES[months[months.length - 1].month]} ${months[months.length - 1].year}`

  return (
    <div className="min-h-screen bg-[#f1f2f4] flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-7xl">

        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <span>📅</span> Group Availability
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Mark dates you&apos;re <strong>unavailable</strong> (drag to multi-select)
          </p>
        </div>

        {/* Name + Save */}
        <div className="flex gap-2 w-1/2 mx-auto mb-1">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setNameError(false) }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Your name"
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3b3bf5] text-sm"
          />
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#3b3bf5] text-white rounded-lg font-medium text-sm hover:bg-[#2d2de0] transition-colors"
          >
            <Check size={18} />
          </button>
        </div>
        <div className="text-center text-sm mb-5 h-5">
          {nameError && <span className="text-red-500 text-xs">Please enter your name.</span>}
          {nameSaved && <span className="text-green-600 text-xs">Saved! Now click or drag to mark your unavailable dates.</span>}
        </div>

        {/* Two-column layout */}
        <div className="flex gap-5 items-stretch">

          {/* LEFT: calendar */}
          <div className="flex-1 min-w-0">

            <div className="bg-white rounded-2xl border border-border p-5 shadow-sm mb-5">
              {/* Nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonths}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-white hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-base text-foreground">{rangeLabel}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={nextMonths}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowMonthMenu(!showMonthMenu)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      {monthCount} Month{monthCount > 1 ? "s" : ""}
                      <ChevronDown size={14} />
                    </button>
                    {showMonthMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                        {MONTH_COUNT_OPTIONS.map((n) => (
                          <button
                            key={n}
                            onClick={() => { setMonthCount(n); setShowMonthMenu(false) }}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${n === monthCount ? "font-semibold text-[#3b3bf5]" : ""}`}
                          >
                            {n} Month{n > 1 ? "s" : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Calendar grids */}
              <div className={`flex gap-6 overflow-x-auto transition-opacity duration-200 ${!activeName ? "opacity-40 pointer-events-none select-none" : ""}`}>
                {months.map(({ year, month }) => (
                  <CalendarGrid
                    key={`${year}-${month}`}
                    year={year}
                    month={month}
                    myUnavailable={unavailable}
                    heatmap={heatmap}
                    totalPeople={totalPeople}
                    today={todayKey}
                    onDayMouseDown={handleDayMouseDown}
                    onDayMouseEnter={handleDayMouseEnter}
                  />
                ))}
              </div>
              {!activeName && (
                <p className="text-center text-xs text-muted-foreground mt-3">Enter your name and hit ✓ to start marking dates.</p>
              )}

              {/* Legend */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border text-xs text-muted-foreground flex-wrap">
                <span className="font-medium">Availability:</span>
                <div className="flex items-center gap-1">
                  {["#5a7d6b","#739e87","#8fb89f","#b2cfc2","#cfe0d8","#eaeeec"].map((c) => (
                    <div key={c} className="w-4 h-4 rounded-sm border border-black/10" style={{ background: c }} />
                  ))}
                </div>
                <span>Most → Least</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <div className="w-4 h-4 rounded border-2 border-[#3b3bf5]" />
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Responders summary */}
            {responses.size > 0 && (
              <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {responses.size} {responses.size === 1 ? "person" : "people"} responded
                </p>
                <div className="flex flex-col gap-2">
                  {Array.from(responses.entries()).map(([person, dates]) => (
                    <div key={person} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#3b3bf5]/10 text-[#3b3bf5] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {person[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-foreground">{person}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {dates.size === 0 ? "— all dates free" : `— ${dates.size} date${dates.size > 1 ? "s" : ""} unavailable`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: whiteboard */}
          <div className="w-80 shrink-0 self-stretch flex flex-col">
            <Whiteboard activeName={activeName} />
          </div>

        </div>
      </div>
    </div>
  )
}
