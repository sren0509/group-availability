import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from './supabase'

const URL_SPLIT = /(https?:\/\/[^\s]+|(?:www\.)[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|net|io|app|co|tv|gg|ai|dev|me|edu|gov|uk)[^\s]*)/g
const URL_TEST  = /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(?:com|org|net|io|app|co|tv|gg|ai|dev|me|edu|gov|uk))/

function NoteContent({ text }) {
  const parts = text.split(URL_SPLIT)
  return (
    <>
      {parts.map((part, i) => {
        if (!URL_TEST.test(part)) return <span key={i}>{part}</span>
        const href = part.startsWith('http') ? part : `https://${part}`
        return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="underline break-all" onClick={e => e.stopPropagation()}>{part}</a>
      })}
    </>
  )
}

const NOTE_COLORS = [
  "bg-yellow-100 border-yellow-300",
  "bg-pink-100 border-pink-300",
  "bg-blue-100 border-blue-300",
  "bg-green-100 border-green-300",
  "bg-purple-100 border-purple-300",
  "bg-orange-100 border-orange-300",
]

export default function Whiteboard({ activeName, eventId }) {
  const [notes, setNotes] = useState([])
  const [memoInput, setMemoInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (eventId) fetchNotes() }, [eventId])

  async function fetchNotes() {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
    if (data) setNotes(data)
  }

  async function handlePost() {
    const text = memoInput.trim()
    if (!text) return
    setSubmitting(true)
    await supabase.from('notes').insert({ event_id: eventId, content: text, author: activeName || 'Anonymous' })
    setSubmitting(false)
    setMemoInput("")
    fetchNotes()
  }

  async function handleDelete(id) {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <span className="text-base">🗒️</span>
        <h2 className="text-sm font-semibold text-foreground">Trip Whiteboard</h2>
      </div>

      <div
        className="flex-1 overflow-y-auto p-5 bg-[#fffef5]"
        style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #e5e7eb 27px, #e5e7eb 28px)", backgroundPositionY: "12px" }}
      >
        {notes.length === 0 ? (
          <p className="text-muted-foreground/40 text-sm italic select-none">Nothing here yet — be the first!</p>
        ) : (
          <div className="flex flex-wrap gap-4 content-start">
            {notes.map((note, i) => (
              <div
                key={note.id}
                className={`${NOTE_COLORS[i % NOTE_COLORS.length]} border rounded-lg px-3 py-2.5 shadow-sm relative group`}
                style={{ transform: `rotate(${((i * 37) % 7) - 3}deg)`, width: "fit-content", maxWidth: "160px" }}
              >
                <div className="absolute -top-5 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <span className="text-[10px] font-semibold text-gray-600 bg-white/80 px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                    {note.author}
                  </span>
                </div>
                <div className="absolute inset-0 rounded-lg bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
                <button
                  onClick={() => handleDelete(note.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                >
                  <X size={10} />
                </button>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-snug break-words"><NoteContent text={note.content} /></p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-border bg-white flex gap-2 items-end">
        <textarea
          value={memoInput}
          onChange={(e) => setMemoInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost() } }}
          placeholder="Destination ideas, packing list, reminders..."
          rows={2}
          className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-[#f9f9fb] text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3b3bf5] resize-none"
        />
        <button
          onClick={handlePost}
          disabled={submitting || !memoInput.trim() || !activeName}
          className="px-5 py-2.5 bg-[#3b3bf5] text-white rounded-lg text-sm font-medium hover:bg-[#2d2de0] transition-colors whitespace-nowrap disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </div>
  )
}
