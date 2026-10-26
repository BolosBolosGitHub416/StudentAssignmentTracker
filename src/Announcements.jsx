// src/Announcements.jsx - announcement board admins and advisors can post
import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import './notifications.css';

const authorName = (a) => {
  const u = a.createdBy;
  if (!u) return '';
  return u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : u.name || '';
};

export default function Announcements({ token, user }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', course: 'General', message: '' });
  const [status, setStatus] = useState(null); // { type: 'ok' | 'error', text }
  const canPost = ['admin', 'advisor'].includes(user?.role);

  const load = async () => {
    try { setItems(await apiFetch('/api/announcements', { token })); } catch { setItems([]); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [token]);

  const post = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setStatus({ type: 'error', text: 'Enter a title and a message.' });
      return;
    }
    try {
      await apiFetch('/api/announcements', { method: 'POST', token, body: form });
      setForm({ title: '', course: form.course, message: '' });
      setStatus({ type: 'ok', text: 'Announcement posted.' });
      load();
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="dx-card">
      <h2>Announcement board</h2>
      {items.length === 0 && <p className="dx-muted">Welcome to Student Assignment Tracker! This is our announcement board. We have implemented at least two additional in-scope features implemented - login and register page, and searching assignments. Stay tuned for more updates!</p>}
      {items.map((a) => (
        <div key={a._id} className="dx-announcement">
          <strong>{a.title}</strong> <span className="dx-muted">({a.course}{authorName(a) ? `, ${authorName(a)}` : ''})</span>
          <p>{a.message}</p>
        </div>
      ))}
      {canPost && (
        <form onSubmit={post} style={{ marginTop: 14 }}>
          <div className="dx-row" style={{ marginBottom: 8 }}>
            <input className="dx-input dx-input-grow" placeholder="Title" aria-label="Announcement title"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="dx-input" placeholder="Course" aria-label="Announcement course"
              value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          </div>
          <textarea className="dx-input" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8 }} rows={2}
            placeholder="Message" aria-label="Announcement message"
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <div className="dx-row">
            <button className="dx-btn" type="submit">Post announcement</button>
            {status && <span role="status" style={{ fontSize: 13, color: status.type === 'ok' ? '#2e7d32' : '#c62828' }}>{status.text}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
