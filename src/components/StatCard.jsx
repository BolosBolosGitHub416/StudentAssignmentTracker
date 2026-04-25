const StatCard = ({ title, value, color }) => {
  return (
    <div
      style={{
        borderTop: `4px solid ${color}`,
        padding: "15px",
        borderRadius: "10px",
        background: "#fff",
        boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
      }}
    >
      <p style={{ color: "#777" }}>{title}</p>
      <h2 style={{ color }}>{value}</h2>
    </div>
  );
};

export default StatCard;