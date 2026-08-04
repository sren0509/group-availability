import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function Whiteboard() {
  const [notes, setNotes] = useState([])
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchNotes() }, [])

  async function fetchNotes() {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setNotes(data)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('notes').insert({
      content: content.trim(),
      author: author.trim() || 'Anonymous'
    })
    setSubmitting(false)
    if (error) return
    setContent('')
    fetchNotes()
  }

  async function handleDelete(id) {
    await supabase.from('notes').delete().eq('id', id)
    fetchNotes()
  }

  return (
    <div className="whiteboard">
      <h2>📝 Whiteboard</h2>
      <form onSubmit={handleSubmit} className="whiteboard-form">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          className="whiteboard-author"
        />
        <textarea
          placeholder="Write anything..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          required
        />
        <button type="submit" disabled={submitting || !content.trim()}>
          {submitting ? '...' : 'Post'}
        </button>
      </form>

      <div className="notes-list">
        {notes.map(note => (
          <div key={note.id} className="note-card">
            <div className="note-header">
              <span className="note-author">{note.author}</span>
              <span className="note-time">
                {new Date(note.created_at).toLocaleString()}
              </span>
            </div>
            <p className="note-content">{note.content}</p>
            <button className="note-delete" onClick={() => handleDelete(note.id)}>×</button>
          </div>
        ))}
        {notes.length === 0 && <p className="no-notes">No notes yet. Be the first!</p>}
      </div>
    </div>
  )
}
