import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { supabase } from './supabase'

const today = new Date()
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

function StaticCalendar({ year, month }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return (
    <div className="flex-1 min-w-0">
      <div className="text-center font-bold text-base mb-3 text-foreground">{MONTH_NAMES[month]} {year}</div>
      <div className="grid grid-cols-7">
        {DAYS.map(d => <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className="h-14 border border-border" style={{ backgroundColor: d ? '#eaeeec' : undefined }} />
        ))}
      </div>
    </div>
  )
}

function AppShell() {
  const m0 = today.getMonth()
  const m1 = (m0 + 1) % 12
  const y0 = today.getFullYear()
  const y1 = m1 === 0 ? y0 + 1 : y0
  const label = `${MONTH_NAMES[m0]} ${y0} — ${MONTH_NAMES[m1]} ${y1}`

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 relative" style={{ backgroundImage: "url('/bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm pointer-events-none" />
      <div className="w-full max-w-7xl">
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <span>📅</span> Group Availability
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Mark dates you&apos;re <strong>unavailable</strong> (drag to multi-select)
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-lg font-semibold text-foreground whitespace-nowrap">My name is</span>
          <div className="w-40 border-b-2 border-border" />
          <div className="w-10 h-10 rounded-full bg-[#3b3bf5] flex items-center justify-center">
            <Check size={18} className="text-white" />
          </div>
        </div>
        <div className="flex gap-5 items-stretch">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-border p-5 shadow-sm mb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center">
                  <ChevronLeft size={16} />
                </div>
                <span className="font-bold text-base text-foreground">{label}</span>
                <div className="w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center">
                  <ChevronRight size={16} />
                </div>
              </div>
              <div className="flex gap-6 overflow-x-auto opacity-60 pointer-events-none select-none">
                <StaticCalendar year={y0} month={m0} />
                <StaticCalendar year={y1} month={m1} />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">Enter your name above to start marking your unavailable dates.</p>
            </div>
          </div>
          <div className="w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden h-full flex flex-col">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <span className="text-base">🗒️</span>
                <h2 className="text-sm font-semibold text-foreground">Trip Whiteboard</h2>
              </div>
              <div className="flex-1 p-5 bg-[#fffef5]">
                <p className="text-muted-foreground/40 text-sm italic select-none">Nothing here yet — be the first!</p>
              </div>
              <div className="px-5 py-4 border-t border-border bg-white flex gap-2 items-end">
                <div className="flex-1 h-16 rounded-lg border border-border bg-[#f9f9fb]" />
                <div className="px-5 py-2.5 bg-[#3b3bf5] text-white rounded-lg text-sm font-medium opacity-50">Post</div>
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
      {/* Background: full app shell */}
      <AppShell />

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        <div className="relative z-10 bg-white rounded-2xl border border-border shadow-xl p-8 w-full max-w-sm flex flex-col gap-5">
          <div className="text-center">
            <div className="text-3xl mb-2">📅</div>
            <h2 className="text-xl font-bold text-foreground">Plan a Trip</h2>
            <p className="text-xs text-muted-foreground mt-1">Coordinate dates with your group</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Trip name
            </label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => { setTripName(e.target.value); setError("") }}
              onKeyDown={onKey}
              placeholder="e.g. Japan trip 2027"
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-[#f9f9fb] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3b3bf5] text-sm"
            />
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Your name <span className="font-normal normal-case text-muted-foreground/60">(optional)</span>
            </label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              onKeyDown={onKey}
              placeholder="So others know who created this"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-[#f9f9fb] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3b3bf5] text-sm"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 bg-[#3b3bf5] text-white rounded-xl font-semibold text-sm hover:bg-[#2d2de0] transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  )
}
