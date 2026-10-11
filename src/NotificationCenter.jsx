// src/NotificationCenter.jsx in-app notifications, priority alerts and preferences
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api';
import { connectSocket } from './socket';
import './notifications.css';

const CHIP = {
  OVERDUE: { bg: '#fdecea', text: '#c62828' },
  CRITICAL: { bg: '#fff3e0', text: '#e65100' },
  HIGH: { bg: '#fff8e1', text: '#f57f17' },
  MEDIUM: { bg: '#e3f2fd', text: '#1565c0' },
  LOW: { bg: '#e8f5e9', text: '#2e7d32' },
};
const LEVELS = [
  ['OVERDUE', 'Only overdue work'],
  ['CRITICAL', 'Critical and overdue'],
  ['HIGH', 'High priority and above (recommended)'],
  ['MEDIUM', 'Medium priority and above'],
  ['LOW', 'Everything'],
];

export default function NotificationCenter({ token }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [prefs, setPrefs] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/api/notifications', { token });
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch { /* leave list empty */ }
  }, [token]);

  useEffect(() => {
    load();
    apiFetch('/api/notifications/prefs', { token }).then(setPrefs).catch(() => {});
  }, [token, load]);

  // new notifications arrive in real time
  useEffect(() => {
    const socket = connectSocket(token);
    const onNotification = (n) => {
      setItems((prev) => (prev.some((p) => p._id === n._id) ? prev : [n, ...prev].slice(0, 30)));
      setUnread((u) => u + 1);
    };
    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [token]);

  const markRead = async (n) => {
    if (n.read) return;
    setItems((prev) => prev.map((p) => (p._id === n._id ? { ...p, read: true } : p)));
    setUnread((u) => Math.max(0, u - 1));
    if (!n.transient) apiFetch(`/api/notifications/${n._id}/read`, { method: 'PUT', token }).catch(() => {});
  };

  const markAll = async () => {
    setItems((prev) => prev.map((p) => ({ ...p, read: true })));
    setUnread(0);
    apiFetch('/api/notifications/read-all', { method: 'PUT', token }).catch(() => {});
  };

  const checkNow = async () => {
    try {
      const r = await apiFetch('/api/notifications/check', { method: 'POST', token });
      setMessage(r.created ? `${r.created} new alert${r.created > 1 ? 's' : ''} found.` : 'No new alerts. You are up to date.');
      if (r.created) load();
    } catch (err) { setMessage(err.message); }
  };

  const savePref = async (change) => {
    const next = { ...prefs, ...change };
    setPrefs(next);
    try {
      setPrefs(await apiFetch('/api/notifications/prefs', { method: 'PUT', token, body: change }));
      setMessage('Preferences saved.');
    } catch (err) { setMessage(err.message); }
  };

  return (
    <div className="dx-card">
      <div className="dx-row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Notifications{unread > 0 && <span className="dx-badge">{unread}</span>}</h2>
        <div className="dx-row">
          <button className="dx-btn-light" onClick={checkNow}>Check deadlines now</button>
          <button className="dx-btn-light" onClick={markAll} disabled={unread === 0}>Mark all read</button>
          <button className="dx-btn-light" onClick={() => setShowSettings((s) => !s)} aria-expanded={showSettings}>Settings</button>
        </div>
      </div>
      {message && <p className="dx-muted" role="status" style={{ margin: '8px 0 0' }}>{message}</p>}

      {showSettings && prefs && (
        <div className="dx-settings">
          <label>
            <input type="checkbox" checked={prefs.inAppAlerts} onChange={(e) => savePref({ inAppAlerts: e.target.checked })} />
            Show deadline alerts in the app
          </label>
          <label>
            <input type="checkbox" checked={prefs.emailReminders} onChange={(e) => savePref({ emailReminders: e.target.checked })} />
            Email me deadline reminders
          </label>
          <label>
            Alert me for
            <select className="dx-input" value={prefs.minPriority} onChange={(e) => savePref({ minPriority: e.target.value })}>
              {LEVELS.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
            </select>
          </label>
          <label>
            Remind me up to
            <select className="dx-input" value={prefs.reminderDaysBefore} onChange={(e) => savePref({ reminderDaysBefore: Number(e.target.value) })}>
              {[0, 1, 2, 3, 5, 7, 14].map((d) => <option key={d} value={d}>{d === 0 ? 'the day of the deadline' : `${d} day${d > 1 ? 's' : ''} before`}</option>)}
            </select>
          </label>
        </div>
      )}

      {items.length === 0 && <p className="dx-muted">No notifications yet. Alerts for upcoming and overdue work will appear here.</p>}
      {items.map((n) => {
        const c = CHIP[n.priority] || CHIP.MEDIUM;
        return (
          <div key={n._id} className={`dx-notif ${n.read ? '' : 'unread'}`}>
            <div>
              <span className="dx-chip" style={{ background: c.bg, color: c.text }}>{n.priority}</span>
              <strong>{n.title}</strong>
              <p>{n.message}</p>
              <span className="dx-muted">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            {!n.read && <button className="dx-btn-light" style={{ alignSelf: 'flex-start' }} onClick={() => markRead(n)}>Mark read</button>}
          </div>
        );
      })}
    </div>
  );
}
