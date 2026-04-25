const ProgressBar = ({ value, color = "#4CAF50" }) => {
  return (
    <div style={{ background: "#eee", borderRadius: "10px", height: "10px" }}>
      <div
        style={{
          width: `${value}%`,
          background: color,
          height: "100%",
          borderRadius: "10px",
          transition: "0.3s",
        }}
      ></div>
    </div>
  );
};

export default ProgressBar;