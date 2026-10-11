// src/Chat.jsx - course chat board (authenticated, history saved)
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from './api';
import { connectSocket } from './socket';
import './notifications.css';

export default function Chat({ token, courses = [] }) {
  const options = [...new Set(['General', ...courses])];
  const [course, setCourse] = useState('General');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const boxRef = useRef(null);

  useEffect(() => {
    let active = true;
    const socket = connectSocket(token);
    socket.emit('joinCourse', course);
    apiFetch(`/api/messages?course=${encodeURIComponent(course)}`, { token })
      .then((history) => { if (active) setMessages(history); })
      .catch(() => { if (active) setMessages([]); });

    const onMessage = (msg) => { if (msg.course === course) setMessages((prev) => [...prev, msg]); };
    socket.on('courseMessage', onMessage);
    return () => { active = false; socket.off('courseMessage', onMessage); };
  }, [token, course]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    connectSocket(token).emit('courseMessage', { course, text });
    setText('');
  };

  return (
    <div className="dx-card">
      <h2>Course chat</h2>
      <select className="dx-input" value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Course chat room">
        {options.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="dx-chat-box" ref={boxRef}>
        {messages.length === 0 && <p className="dx-muted">No messages in {course} yet. Say hello.</p>}
        {messages.map((m, i) => <p key={m._id || i}><strong>{m.senderName}:</strong> {m.text}</p>)}
      </div>
      <form className="dx-row" onSubmit={send}>
        <input className="dx-input dx-input-grow" value={text} onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${course}`} maxLength={500} aria-label="Chat message" />
        <button className="dx-btn" type="submit" disabled={!text.trim()}>Send</button>
      </form>
    </div>
  );
}
