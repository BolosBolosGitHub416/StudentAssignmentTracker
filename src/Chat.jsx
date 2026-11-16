
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from './api';
import { connectSocket } from './socket';
import './notifications.css';

export default function Chat({ token, courses = [] }) {
  const options = [...new Set(['General', ...courses])];

  const [course, setCourse] = useState('General');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const boxRef = useRef(null);

  useEffect(() => {
    let active = true;
    const socket = connectSocket(token);

    const joinCourse = () => {
      if (!active) return;
      setConnected(true);
      setError('');
      socket.emit('joinCourse', course);
    };

    const onDisconnect = () => {
      if (active) setConnected(false);
    };

    const onError = (err) => {
      if (active) {
        setConnected(false);
        setError(err.message || 'Chat connection failed');
      }
    };

    const onMessage = (msg) => {
      if (active && msg.course === course) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) {
            return prev;
          }
          return [...prev, msg];
        });
      }
    };

    socket.on('connect', joinCourse);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    socket.on('courseMessage', onMessage);

    if (socket.connected) {
      joinCourse();
    } else {
      setConnected(false);
    }

    apiFetch(`/api/messages?course=${encodeURIComponent(course)}`, {
      token,
    })
      .then((history) => {
        if (active) {
          setMessages((prev) => {
            const combined = [...history, ...prev.filter(
              (m) => m.course === course
            )];
            return [...new Map(
              combined.map((m) => [m._id, m])
            ).values()];
          });
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
      socket.off('connect', joinCourse);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
      socket.off('courseMessage', onMessage);
    };
  }, [token, course]);

  useEffect(() => {
    setMessages([]);
    setError('');
  }, [course]);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  const send = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    const socket = connectSocket(token);

    if (!socket.connected) {
      setError('Chat is disconnected. Please try again.');
      return;
    }

    socket.emit('courseMessage', {
      course,
      text: text.trim(),
    });

    setText('');
    setError('');
  };

  return (
    <div className="dx-card">
      <h2>Course chat</h2>

      <p className="dx-muted">
        Status: {connected ? 'Connected' : 'Disconnected'}
      </p>

      {error && (
        <p role="alert" style={{ color: '#e53935' }}>
          {error}
        </p>
      )}

      <select
        className="dx-input"
        value={course}
        onChange={(e) => setCourse(e.target.value)}
        aria-label="Course chat room"
      >
        {options.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <div className="dx-chat-box" ref={boxRef}>
        {messages.length === 0 && (
          <p className="dx-muted">
            No messages in {course} yet. Say hello.
          </p>
        )}

        {messages.map((m, i) => (
          <p key={m._id || i}>
            <strong>{m.senderName}:</strong> {m.text}
          </p>
        ))}
      </div>

      <form className="dx-row" onSubmit={send}>
        <input
          className="dx-input dx-input-grow"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${course}`}
          maxLength={500}
          aria-label="Chat message"
        />

        <button
          className="dx-btn"
          type="submit"
          disabled={!text.trim() || !connected}
        >
          Send
        </button>
      </form>
    </div>
  );
}
