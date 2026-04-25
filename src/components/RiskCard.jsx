const RiskCard = ({ risk, message }) => {
  const colors = {
    LOW: "#52c41a",
    MEDIUM: "#faad14",
    HIGH: "#ff4d4f",
  };

  return (
    <div
      style={{
        border: `2px solid ${colors[risk]}`,
        borderRadius: "12px",
        padding: "20px",
        background: "#fff",
      }}
    >
      <h3 style={{ color: colors[risk] }}>{risk} RISK</h3>
      <p>{message}</p>
    </div>
  );
};

export default RiskCard;