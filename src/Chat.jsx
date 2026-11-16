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
  const [connected, setConnected] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    let active = true;
    const socket = connectSocket(token);


const onConnect = () => {
  setConnected(true);
  socket.emit('joinCourse', course);
};

const onDisconnect = () => {
  setConnected(false);
};


setConnected(socket.connected);

socket.on('connect', onConnect);
socket.on('disconnect', onDisconnect);


if (socket.connected) {
  socket.emit('joinCourse', course);
}
    apiFetch(`/api/messages?course=${encodeURIComponent(course)}`, { token })
      .then((history) => { if (active) setMessages(history); })
      .catch(() => { if (active) setMessages([]); });

    const onMessage = (msg) => { if (msg.course === course) setMessages((prev) => [...prev, msg]); };
    socket.on('courseMessage', onMessage);

return () => {
  active = false;
  socket.off('courseMessage', onMessage);
  socket.off('connect', onConnect);
  socket.off('disconnect', onDisconnect);
};
  }, [token, course]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
if (!text.trim() || !connected) return;    
connectSocket(token).emit('courseMessage', { course, text });
    setText('');
  };

  return (
    <div className="dx-card">
      
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '10px'
}}>
  <h2>Course Chat — {course}</h2>

  <span style={{
    backgroundColor: '#eeeeee',
    padding: '6px 12px',
    borderRadius: '15px',
    fontSize: '14px',
    color: '#333'
  }}>
    {messages.length} messages
  </span>
</div>

<p style={{
  color: connected ? '#16a34a' : '#dc2626',
  fontSize: '14px',
  fontWeight: 'bold'
}}>
  {connected
    ? '● Connected to chat'
    : '● Disconnected from chat'}
</p>

      <select className="dx-input" value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Course chat room">
        {options.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="dx-chat-box" ref={boxRef}>

{messages.length === 0 && (
  <div style={{
    textAlign: 'center',
    padding: '30px 15px',
    color: '#777'
  }}>
    <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
      No messages yet
    </p>
    <p>
      Start a conversation in the {course} chat room!
    </p>
  </div>
)}

{messages.map((m, i) => (
  <div
    key={m._id || i}
    style={{
      backgroundColor: '#f1f5f9',
      padding: '12px 15px',
      borderRadius: '12px',
      marginBottom: '10px',
      border: '1px solid #e2e8f0'
    }}
  >
    <strong style={{
      color: '#2563eb',
      display: 'block',
      marginBottom: '5px'
    }}>
      {m.senderName || 'Student'}
    </strong>

    <p style={{
      margin: 0,
      color: '#333',
      overflowWrap: 'anywhere'
    }}>
      {m.text}
    </p>
  </div>
))}
      </div>
      <form className="dx-row" onSubmit={send}>
        <input className="dx-input dx-input-grow" value={text} onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${course}`} maxLength={500} aria-label="Chat message" />

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
