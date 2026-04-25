import { getPriority } from "../utils/priority";

const AssignmentCard = ({ assignment }) => {
  const priority = getPriority(assignment.daysLeft);

  const colors = {
    CRITICAL: "#ff4d4f",
    HIGH: "#faad14",
    MEDIUM: "#1890ff",
  };

  return (
    <div
      style={{
        border: `2px solid ${colors[priority]}`,
        borderRadius: "12px",
        padding: "15px",
        marginBottom: "10px",
        background: "#fff",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        transition: "0.2s",
      }}
    >
      <h4>{assignment.title}</h4>
      <p>{assignment.course}</p>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: colors[priority], fontWeight: "bold" }}>
          {priority}
        </span>
        <span>in {assignment.daysLeft}d</span>
        <span>{assignment.progress}%</span>
      </div>
    </div>
  );
};

export default AssignmentCard;