import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PerformanceChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="grade"
          stroke="#4CAF50"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;