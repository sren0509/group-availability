import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, Check, Save, Pencil, Copy, Share2, QrCode, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import CalendarGrid, { dateKey } from './CalendarGrid'
import Whiteboard from './Whiteboard'
import { supabase } from './supabase'

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const MONTH_COUNT_OPTIONS = [1, 2, 3]


export default function EventPage() {
  const { id: eventId } = useParams()
  const location = useLocation()
  const today = new Date()
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate())

  // Event metadata
  const [event, setEvent] = useState(null)
  const [eventNotFound, setEventNotFound] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameEditVal, setNameEditVal] = useState("")

  // Participant
  const [nameInput, setNameInput] = useState("")
  const [nameError, setNameError] = useState(false)
  const [activeName, setActiveName] = useState("")

  // Calendar
  const [startYear, setStartYear] = useState(today.getFullYear())
  const [startMonth, setStartMonth] = useState(today.getMonth())
  const [monthCount, setMonthCount] = useState(2)
  const [showMonthMenu, setShowMonthMenu] = useState(false)
  const [responses, setResponses] = useState(new Map())
  const [unavailable, setUnavailable] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")

  // Share banner — only auto-open when coming from event creation
  const [bannerCollapsed, setBannerCollapsed] = useState(!location.state?.justCreated)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)

  const dragging = useRef(false)
  const dragMode = useRef("add")
  const draggedKeys = useRef(new Set())

  useEffect(() => { fetchEvent() }, [eventId])
  useEffect(() => {
    if (!event) return
    fetchAllResponses()
    const creator = location.state?.creatorName
    if (creator) {
      setNameInput(creator)
      setActiveName(creator)
    }
  }, [event])

  async function fetchEvent() {
    const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
    if (!data) { setEventNotFound(true); return }
    setEvent(data)
  }

  async function fetchAllResponses() {
    const { data } = await supabase.from('responses').select('*').eq('event_id', eventId)
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

  const handleLogin = () => {
    const n = nameInput.trim()
    if (!n) { setNameError(true); return }
    setNameError(false)
    setActiveName(n)
    const existing = responses.get(n)
    setUnavailable(existing ? new Set(existing) : new Set())
  }

  const updateLocal = (next) => {
    setResponses(prev => {
      const updated = new Map(prev)
      updated.set(activeName, new Set(next))
      return updated
    })
  }

  const handleDayMouseDown = useCallback((key) => {
    dragging.current = true
    draggedKeys.current = new Set([key])
    const next = new Set(unavailable)
    if (next.has(key)) { dragMode.current = "remove"; next.delete(key) }
    else { dragMode.current = "add"; next.add(key) }
    setUnavailable(next)
    updateLocal(next)
  }, [unavailable, activeName])

  const handleDayMouseEnter = useCallback((key) => {
    if (!dragging.current || draggedKeys.current.has(key)) return
    draggedKeys.current.add(key)
    const next = new Set(unavailable)
    if (dragMode.current === "add") next.add(key)
    else next.delete(key)
    setUnavailable(next)
    updateLocal(next)
  }, [unavailable, activeName])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('responses').upsert(
      { event_id: eventId, name: activeName, unavailable_dates: [...unavailable], updated_at: new Date().toISOString() },
      { onConflict: 'event_id,name' }
    )
    setSaving(false)
    if (error) { setSaveMsg("Error saving. Try again.") }
    else { setSaveMsg("Saved!") }
    setTimeout(() => setSaveMsg(""), 2500)
  }

  // Event name inline editing
  const startEditName = () => {
    setNameEditVal(event.name)
    setEditingName(true)
  }

  const saveEventName = async () => {
    const trimmed = nameEditVal.trim()
    setEditingName(false)
    if (!trimmed || trimmed === event.name) return
    await supabase.from('events').update({ name: trimmed }).eq('id', eventId)
    setEvent(prev => ({ ...prev, name: trimmed }))
  }

  const onNameEditKey = (e) => {
    if (e.key === 'Enter') saveEventName()
    if (e.key === 'Escape') setEditingName(false)
  }

  const shareUrl = `${window.location.origin}/e/${eventId}`
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calendar navigation
  const prevMonths = () => {
    let m = startMonth - monthCount, y = startYear
    while (m < 0) { m += 12; y -= 1 }
    setStartYear(y); setStartMonth(m)
  }
  const nextMonths = () => {
    let m = startMonth + monthCount, y = startYear
    while (m > 11) { m -= 12; y += 1 }
    setStartYear(y); setStartMonth(m)
  }

  const months = []
  for (let i = 0; i < monthCount; i++) {
    let m = startMonth + i, y = startYear
    while (m > 11) { m -= 12; y += 1 }
    months.push({ year: y, month: m })
  }
  const rangeLabel = monthCount === 1
    ? `${MONTH_NAMES[months[0].month]} ${months[0].year}`
    : `${MONTH_NAMES[months[0].month]} ${months[0].year} — ${MONTH_NAMES[months[months.length - 1].month]} ${months[months.length - 1].year}`

  if (eventNotFound) {
    return (
      <div className="min-h-screen bg-[#f1f2f4] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-10 text-center max-w-sm">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-lg font-bold text-foreground mb-1">Event not found</h2>
          <p className="text-sm text-muted-foreground mb-5">This link may be invalid or the event was removed.</p>
          <a href="/" className="inline-block px-5 py-2.5 bg-[#3b3bf5] text-white rounded-lg text-sm font-medium hover:bg-[#2d2de0] transition-colors">
            Create a new event
          </a>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#f1f2f4] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f2f4] flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 group">
              <span className="text-2xl">📅</span>
              {editingName ? (
                <input
                  autoFocus
                  value={nameEditVal}
                  onChange={(e) => setNameEditVal(e.target.value)}
                  onBlur={saveEventName}
                  onKeyDown={onNameEditKey}
                  className="text-2xl font-bold text-foreground bg-transparent border-b-2 border-[#3b3bf5] focus:outline-none"
                />
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
                  <button
                    onClick={startEditName}
                    title="Rename event"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <Pencil size={15} />
                  </button>
                </>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Mark dates you&apos;re <strong style={{ color: "#af2634" }}>unavailable</strong> (drag to multi-select)
            </p>
          </div>

          {bannerCollapsed && (
            <button
              onClick={() => setBannerCollapsed(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-sm font-medium text-foreground shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Share2 size={14} /> Share
            </button>
          )}
        </div>

        {/* Share banner */}
        {!bannerCollapsed && (
          <div className="bg-white rounded-2xl border border-border shadow-sm mb-5 overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Your event is live — share this link:
                  </p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-[#f9f9fb] text-foreground text-xs font-mono focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${copied ? "bg-green-100 text-green-700" : "bg-[#3b3bf5] text-white hover:bg-[#2d2de0]"}`}
                    >
                      {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <button
                    onClick={() => setShowQR(p => !p)}
                    title="QR code"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${showQR ? "bg-[#3b3bf5] text-white border-[#3b3bf5]" : "border-border bg-white text-muted-foreground hover:bg-gray-50"}`}
                  >
                    <QrCode size={14} />
                  </button>
                  <button
                    onClick={() => setBannerCollapsed(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-gray-50 transition-colors"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              {showQR && (
                <div className="mt-3 pt-3 border-t border-border flex items-start gap-4">
                  <div className="p-2 bg-white border border-border rounded-xl shadow-sm">
                    <QRCodeSVG value={shareUrl} size={126} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Scan to open</p>
                    <p className="text-[11px] text-muted-foreground max-w-xs">Share this QR code with your group so they can quickly open the event on their phone.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Name input */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-lg font-semibold text-foreground whitespace-nowrap">My name is</span>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setNameError(false) }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="your name"
            className="text-lg text-center bg-transparent border-0 border-b-2 border-border focus:outline-none focus:border-[#3b3bf5] text-foreground placeholder:text-muted-foreground w-40 pb-0.5"
          />
          <button
            onClick={handleLogin}
            className="w-10 h-10 rounded-full bg-[#3b3bf5] text-white flex items-center justify-center hover:bg-[#2d2de0] transition-colors shrink-0"
          >
            <Check size={18} />
          </button>
        </div>
        {nameError
          ? <p className="text-red-500 text-xs text-center -mt-4 mb-4">Please enter your name.</p>
          : !activeName && <p className="text-muted-foreground text-xs text-center -mt-4 mb-4">Enter your name and hit ✓ to start marking dates.</p>
        }

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
                    responses={responses}
                  />
                ))}
              </div>

              {/* Legend + Save */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="font-medium">Availability:</span>
                  <div className="flex items-center gap-1">
                    {["#5a7d6b","#739e87","#8fb89f","#cfe0d8","#eaeeec"].map((c) => (
                      <div key={c} className="w-4 h-4 rounded-sm border border-black/10" style={{ background: c }} />
                    ))}
                  </div>
                  <span>Most → Least</span>
                  <div className="flex items-center gap-1.5 ml-2">
                    <div className="w-4 h-4 rounded border-2 border-[#3b3bf5]" />
                    <span>Today</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {saveMsg && (
                    <span className={`text-xs font-medium ${saveMsg === "Saved!" ? "text-green-600" : "text-red-500"}`}>
                      {saveMsg}
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || !activeName}
                    className="flex items-center gap-2 px-5 py-2 bg-[#3b3bf5] text-white rounded-lg text-sm font-medium hover:bg-[#2d2de0] transition-colors disabled:opacity-50"
                  >
                    <Save size={15} />
                    {saving ? "Saving..." : "Save"}
                  </button>
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
            <Whiteboard activeName={activeName} eventId={eventId} />
          </div>

        </div>
      </div>
    </div>
  )
}
