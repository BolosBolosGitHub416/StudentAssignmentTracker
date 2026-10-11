// src/GpaTrendChart.jsx - GPA trend line stakeholder: adding GPA trends
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import './notifications.css';

const label = (iso) => new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '6px 10px', fontSize: 12 }}>
      <strong>{p.title}</strong>
      <div>GPA after this grade: {p.gpa.toFixed(1)}</div>
      <div>Average: {p.average}%</div>
    </div>
  );
}

export default function GpaTrendChart({ data = [] }) {
  if (data.length < 2) {
    return <p className="dx-muted">Record grades on at least two assignments to see your GPA trend.</p>;
  }
  const points = data.map((d) => ({ ...d, label: label(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3f2fd" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 12 }} width={32} />
        <Tooltip content={<TrendTooltip />} />
        <Line type="monotone" dataKey="gpa" stroke="#1976d2" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
