
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
  const [filter, setFilter] = useState('all');
  const [prefs, setPrefs] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const unread = items.filter((n) => !n.read).length;

  const filteredItems = items.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  // Load notifications from backend
  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      setError('Please sign in to view notifications.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await apiFetch('/api/notifications', { token });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError('Unable to load notifications. Check your backend connection.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();

    if (!token) return;

    apiFetch('/api/notifications/prefs', { token })
      .then(setPrefs)
      .catch(() => {});
  }, [token, load]);

  // Receive notifications in real time
  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    const onNotification = (notification) => {
      setItems((prev) => {
        if (prev.some((n) => n._id === notification._id)) {
          return prev;
        }

        return [notification, ...prev].slice(0, 30);
      });
    };

    socket.on('notification', onNotification);

    return () => {
      socket.off('notification', onNotification);
    };
  }, [token]);

  // Mark one notification as read
  const markRead = async (notification) => {
    if (notification.read) return;

    setItems((prev) =>
      prev.map((n) =>
        n._id === notification._id
          ? { ...n, read: true }
          : n
      )
    );

    if (!notification.transient) {
      try {
        await apiFetch(
          `/api/notifications/${notification._id}/read`,
          { method: 'PUT', token }
        );
      } catch (err) {
        setError('Could not save the read status.');
        load();
      }
    }
  };

  // Mark every notification as read
  const markAll = async () => {
    const previous = items;

    setItems((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );

    try {
      await apiFetch('/api/notifications/read-all', {
        method: 'PUT',
        token,
      });
      setMessage('All notifications marked as read.');
    } catch (err) {
      setItems(previous);
      setError('Unable to mark all notifications as read.');
    }
  };

  // Check for upcoming and overdue assignments
  const checkNow = async () => {
    try {
      setMessage('');
      setError('');

      const result = await apiFetch('/api/notifications/check', {
        method: 'POST',
        token,
      });

      if (result.created > 0) {
        setMessage(
          `${result.created} new alert${result.created > 1 ? 's' : ''} found.`
        );
      } else {
        setMessage('No new alerts. You are up to date.');
      }

      await load();
    } catch (err) {
      setError('Unable to check deadlines. Check your backend connection.');
    }
  };

  // Save notification preferences
  const savePref = async (change) => {
    const previous = prefs;
    const next = { ...prefs, ...change };

    setPrefs(next);
    setMessage('');

    try {
      const saved = await apiFetch('/api/notifications/prefs', {
        method: 'PUT',
        token,
        body: change,
      });

      setPrefs(saved);
      setMessage('Preferences saved successfully.');
    } catch (err) {
      setPrefs(previous);
      setError('Unable to save notification preferences.');
    }
  };

  return (
    <div className="dx-card">

      {/* Header */}
      <div
        className="dx-row"
        style={{
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h2 style={{ margin: 0 }}>
          Notifications

          {unread > 0 && (
            <span className="dx-badge">
              {unread}
            </span>
          )}
        </h2>

        <div className="dx-row">
          <button
            className="dx-btn-light"
            onClick={checkNow}
            disabled={!token}
          >
            Check deadlines now
          </button>

          <button
            className="dx-btn-light"
            onClick={markAll}
            disabled={unread === 0 || !token}
          >
            Mark all as read
          </button>

          <button
            className="dx-btn-light"
            onClick={() => setShowSettings((s) => !s)}
            aria-expanded={showSettings}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Success messages */}
      {message && (
        <p
          role="status"
          style={{
            color: '#15803d',
            marginTop: '12px',
          }}
        >
          {message}
        </p>
      )}

      {/* Error messages */}
      {error && (
        <p
          role="alert"
          style={{
            color: '#dc2626',
            marginTop: '12px',
          }}
        >
          {error}
        </p>
      )}

      {/* Notification filters */}
      <div
        className="dx-row"
        style={{
          marginTop: '20px',
          marginBottom: '15px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {[
          ['all', 'All'],
          ['unread', 'Unread'],
          ['read', 'Read'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className="dx-btn-light"
            style={{
              backgroundColor:
                filter === value ? '#2563eb' : '#f1f5f9',
              color:
                filter === value ? '#ffffff' : '#333333',
              borderRadius: '8px',
            }}
          >
            {label}
            {value === 'unread' ? ` (${unread})` : ''}
          </button>
        ))}
      </div>

      {/* Notification settings */}
      {showSettings && (
        prefs ? (
          <div className="dx-settings">

            <h3>Notification Preferences</h3>

            <label>
              <input
                type="checkbox"
                checked={prefs.inAppAlerts}
                onChange={(e) =>
                  savePref({ inAppAlerts: e.target.checked })
                }
              />
              Show deadline alerts in the app
            </label>

            <label>
              <input
                type="checkbox"
                checked={prefs.emailReminders}
                onChange={(e) =>
                  savePref({ emailReminders: e.target.checked })
                }
              />
              Email me deadline reminders
            </label>

            <label>
              Alert me for

              <select
                className="dx-input"
                value={prefs.minPriority}
                onChange={(e) =>
                  savePref({ minPriority: e.target.value })
                }
              >
                {LEVELS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Remind me up to

              <select
                className="dx-input"
                value={prefs.reminderDaysBefore}
                onChange={(e) =>
                  savePref({
                    reminderDaysBefore: Number(e.target.value),
                  })
                }
              >
                {[0, 1, 2, 3, 5, 7, 14].map((days) => (
                  <option key={days} value={days}>
                    {days === 0
                      ? 'The day of the deadline'
                      : `${days} day${days > 1 ? 's' : ''} before`}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <p className="dx-muted">
            Settings are unavailable until the backend is connected.
          </p>
        )
      )}

      {/* Loading state */}
      {loading && (
        <p className="dx-muted">
          Loading notifications...
        </p>
      )}

      {/* Empty notification state */}
      {!loading && !error && filteredItems.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '30px 15px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            marginTop: '10px',
          }}
        >
          <h3 style={{ color: '#555' }}>
            No notifications to display
          </h3>

          <p style={{ color: '#777' }}>
            {filter === 'unread'
              ? 'You have no unread notifications.'
              : filter === 'read'
              ? 'You have no read notifications.'
              : 'Upcoming deadlines and assignment alerts will appear here.'}
          </p>
        </div>
      )}

      {/* Notification list */}
      {filteredItems.map((n) => {
        const color = CHIP[n.priority] || CHIP.MEDIUM;

        return (
          <div
            key={n._id}
            className={`dx-notif ${n.read ? '' : 'unread'}`}
            style={{
              backgroundColor: n.read ? '#ffffff' : '#eff6ff',
              borderLeft: n.read
                ? '4px solid #e5e7eb'
                : '4px solid #2563eb',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '10px',
            }}
          >
            <div>
              <span
                className="dx-chip"
                style={{
                  backgroundColor: color.bg,
                  color: color.text,
                }}
              >
                {n.priority}
              </span>

              <strong style={{ marginLeft: '8px' }}>
                {n.title}
              </strong>

              <p>{n.message}</p>

              <span className="dx-muted">
                {n.createdAt
                  ? new Date(n.createdAt).toLocaleString()
                  : 'Just now'}
              </span>
            </div>

            {!n.read && (
              <button
                className="dx-btn-light"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => markRead(n)}
              >
                Mark read
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
