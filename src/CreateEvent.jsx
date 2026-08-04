import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { supabase } from './supabase'
import CalendarGrid, { dateKey } from './CalendarGrid'

const today = new Date()
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

// Hardcoded Alaska trip state for background demo
const DEMO_RESPONSES = new Map([
  ["feifei",  new Set([])],
  ["Siying",  new Set(["2026-07-15","2026-07-16","2026-07-17","2026-07-18","2026-07-19","2026-07-20","2026-07-21","2026-07-22","2026-07-23","2026-07-24","2026-07-25","2026-07-26","2026-07-27","2026-07-28","2026-07-29","2026-06-27","2026-06-28"])],
  ["Sally",   new Set(["2026-08-03","2026-08-04","2026-08-05","2026-08-06","2026-08-07","2026-08-08","2026-08-09","2026-08-10","2026-08-11","2026-08-12","2026-08-13","2026-08-14","2026-08-15","2026-08-16","2026-08-17","2026-08-18","2026-08-19","2026-08-20","2026-08-21","2026-08-22","2026-08-23","2026-08-24","2026-08-25","2026-08-26","2026-08-27","2026-08-28","2026-08-29","2026-08-30","2026-08-31","2026-09-01","2026-09-02","2026-09-03","2026-09-04","2026-09-05","2026-09-06","2026-09-07","2026-09-08","2026-09-09","2026-09-10","2026-09-11","2026-09-24","2026-09-25","2026-09-26","2026-09-27","2026-10-01","2026-10-02","2026-10-03","2026-10-04","2026-10-08","2026-10-09","2026-10-10","2026-10-11","2026-10-15","2026-10-16","2026-10-17","2026-10-18","2026-10-22","2026-10-23","2026-10-24","2026-10-25"])],
  ["naye",    new Set(["2026-06-25","2026-06-26","2026-06-27","2026-08-03","2026-08-04","2026-08-05","2026-08-06","2026-08-11","2026-08-12","2026-08-13","2026-08-14"])],
])

const DEMO_HEATMAP = new Map()
DEMO_RESPONSES.forEach((dates) => dates.forEach((d) => DEMO_HEATMAP.set(d, (DEMO_HEATMAP.get(d) || 0) + 1)))
const DEMO_TOTAL = DEMO_RESPONSES.size

function AppShell() {
  const m0 = today.getMonth()
  const m1 = (m0 + 1) % 12
  const y0 = today.getFullYear()
  const y1 = m1 === 0 ? y0 + 1 : y0
  const label = `${MONTH_NAMES[m0]} ${y0} — ${MONTH_NAMES[m1]} ${y1}`
  const todayKey = dateKey(y0, m0, today.getDate())
  const noop = () => {}

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 relative" style={{ backgroundImage: "url('/bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-white/40 pointer-events-none" style={{ backdropFilter: 'blur(8px)' }} />
      <div className="relative z-10 w-full max-w-7xl pointer-events-none select-none">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <span>📅</span> Alaska trip
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Mark dates you&apos;re <strong>unavailable</strong> (drag to multi-select)
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-lg font-semibold text-foreground whitespace-nowrap">My name is</span>
          <div className="w-40 border-b-2 border-border" />
          <div className="w-7 h-7 rounded-full bg-[#3b3bf5] flex items-center justify-center">
            <Check size={13} className="text-white" />
          </div>
        </div>
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-border p-5 shadow-sm mb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center"><ChevronLeft size={16} /></div>
                <span className="font-bold text-base text-foreground">{label}</span>
                <div className="w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center"><ChevronRight size={16} /></div>
              </div>
              <div className="flex gap-6 overflow-x-auto">
                <CalendarGrid year={y0} month={m0} myUnavailable={new Set()} heatmap={DEMO_HEATMAP} totalPeople={DEMO_TOTAL} today={todayKey} onDayMouseDown={noop} onDayMouseEnter={noop} responses={DEMO_RESPONSES} hasSaved={true} />
                <CalendarGrid year={y1} month={m1} myUnavailable={new Set()} heatmap={DEMO_HEATMAP} totalPeople={DEMO_TOTAL} today={todayKey} onDayMouseDown={noop} onDayMouseEnter={noop} responses={DEMO_RESPONSES} hasSaved={true} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">4 people responded</p>
              <div className="flex flex-col gap-2">
                {Array.from(DEMO_RESPONSES.entries()).map(([person, dates]) => (
                  <div key={person} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#3b3bf5]/10 text-[#3b3bf5] flex items-center justify-center text-[10px] font-bold shrink-0">{person[0].toUpperCase()}</div>
                    <div>
                      <span className="text-xs font-semibold text-foreground">{person}</span>
                      <span className="text-xs text-muted-foreground ml-1">{dates.size === 0 ? '— all dates free' : `— ${dates.size} date${dates.size > 1 ? 's' : ''} unavailable`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden h-64 flex flex-col">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <span className="text-base">🗒️</span>
                <h2 className="text-sm font-semibold text-foreground">Trip Whiteboard</h2>
              </div>
              <div className="flex-1 p-5 bg-[#fffef5]">
                <p className="text-muted-foreground/40 text-sm italic">Nothing here yet — be the first!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const [tripName, setTripName] = useState("")
  const [creatorName, setCreatorName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    const name = tripName.trim()
    if (!name) { setError("Please enter a trip name."); return }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('events')
      .insert({ name, created_by: creatorName.trim() || null })
      .select()
      .single()
    setLoading(false)
    if (err) { setError("Something went wrong. Try again."); return }
    navigate(`/e/${data.id}`, { state: { justCreated: true, creatorName: creatorName.trim() } })
  }

  const onKey = (e) => { if (e.key === 'Enter') handleCreate() }

  return (
    <div className="relative">
      <AppShell />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        <div className="relative z-10 bg-white rounded-2xl border border-border shadow-xl p-8 w-full max-w-sm flex flex-col gap-5">
          <div className="text-center">
            <div className="text-3xl mb-2">📅</div>
            <h2 className="text-xl font-bold text-foreground">Plan a Trip</h2>
            <p className="text-xs text-muted-foreground mt-1">Coordinate dates with your group</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Trip name</label>
            <input type="text" value={tripName} onChange={(e) => { setTripName(e.target.value); setError("") }} onKeyDown={onKey} placeholder="e.g. Japan trip 2027" autoFocus className="w-full px-4 py-2.5 rounded-lg border border-border bg-[#f9f9fb] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3b3bf5] text-sm" />
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Your name <span className="font-normal normal-case text-muted-foreground/60">(optional)</span></label>
            <input type="text" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} onKeyDown={onKey} placeholder="So others know who created this" className="w-full px-4 py-2.5 rounded-lg border border-border bg-[#f9f9fb] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3b3bf5] text-sm" />
          </div>
          <button onClick={handleCreate} disabled={loading} className="w-full py-3 bg-[#3b3bf5] text-white rounded-xl font-semibold text-sm hover:bg-[#2d2de0] transition-colors disabled:opacity-50">
            {loading ? "Creating..." : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  )
}
