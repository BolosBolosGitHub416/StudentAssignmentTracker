import { useState, useEffect } from "react";
import "./App.css";
import Announcements from "./Announcements";
import Chat from "./Chat";
import { io } from "socket.io-client";
import AnalyticsDashboard from "./AnalyticsDashboard";
import NotificationCenter from "./NotificationCenter";
import Login from "./Login";

function App() {
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [course, setCourse] = useState("");
  const [grade, setGrade] = useState("");
  const [weight, setWeight] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [refreshKey, setRefreshKey] = useState(0);

useEffect(() => {
  if (!token) return;

  const loadAssignments = async () => {
    try {
      const response = await fetch(
        "http://localhost:8001/api/assignments",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load assignments");
      }

      const data = await response.json();

      setAssignments(
        data.map((assignment) => ({
          ...assignment,
          date: assignment.dueDate
        }))
      );
    } catch (error) {
      console.error(error);
    }
  };

  loadAssignments();
}, [token]);

const [user, setUser] = useState(() =>
  JSON.parse(localStorage.getItem("user") || "null")
);

const [page, setPage] = useState(window.location.pathname);

const handleLogin = (newToken, newUser) => {
  setToken(newToken);
  setUser(newUser);
  window.history.pushState({}, "", "/");
  setPage("/");
};

  useEffect(() => {
  const socket = io("http://localhost:8001");

  socket.on("notification", (msg) => {
    setNotification(msg);
  });

  return () => socket.disconnect();
}, []);

  // Load saved data


  // Save data
  useEffect(() => {
    localStorage.setItem("assignments", JSON.stringify(assignments));
  }, [assignments]);

  
const addAssignment = async () => {
  if (!title || !date) return;

  if (!token) {
    alert("Please log in first.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8001/api/assignments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
  title,
  dueDate: date,
  course: course.trim() || "General",
  grade: grade === "" ? null : Number(grade),
  weight: weight === "" ? 0 : Number(weight)
})
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to add assignment");
    }

    setAssignments((prev) => [
      ...prev,
      {
        ...data,
        date: data.dueDate
      }
    ]);

    setTitle("");
    setDate("");
    setCourse("");
    setGrade("");
setWeight("");
setRefreshKey((prev) => prev + 1);
    alert("Assignment added successfully!");

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};


  
const deleteAssignment = async (index) => {
  const assignment = assignments[index];

  if (!assignment?.id) {
    alert("Assignment ID not found.");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:8001/api/assignments/${assignment.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete assignment");
    }

    setAssignments((prev) =>
      prev.filter((item) => item.id !== assignment.id)
    );
setRefreshKey((prev) => prev + 1);
    alert("Assignment deleted successfully!");
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};


  const checkPriority = (date) => {
    const today = new Date();
    const due = new Date(date);
    const diff = (due - today) / (1000 * 60 * 60 * 24);

    if (diff <= 1) return "CRITICAL";
    if (diff <= 2) return "HIGH";
    if (diff <= 5) return "MEDIUM";
    return "LOW";
  };

  const getPriorityStyle = (priority) => {
    if (priority === "CRITICAL") return { color: "#d50000" };
    if (priority === "HIGH") return { color: "#fb8c00" };
    if (priority === "MEDIUM") return { color: "#ffeb3b" };
    return { color: "#43a047" };
  };

  return (
    <div className="container">
      <h1>Student Assignment Tracker</h1>

      <h4> Welcome to Student Assignment Tracker! </h4>
      {/* <h4> Links to Other Pages coming soon, 
        including a login page, registration page, notifications page,
        a dashboard for analytics page, and many more.
      </h4> */}
      <p> Student Assignment Tracker is currently in a work in progress,
         and will be updated frequently in the future. </p>
      
      <div>
        <ul>
          <li><a href="/">Home</a></li>
<li>
  <a href="/login" onClick={(e) => {
    e.preventDefault();
    window.history.pushState({}, "", "/login");
    setPage("/login");
  }}>
    Login
  </a>
</li>          <li><a href="/register">Register</a></li>
          <li><a href="/notifications">Notifications</a></li>
          <li><a href="/dashboard">Analytics Dashboard</a></li>
        </ul>
      </div>

      {/* Announcement Board */}
      {page === "/login" && (
  <Login onLogin={handleLogin} />
)}
      <NotificationCenter token={token} />
      <Announcements token={token} user={user} />
      <Chat token={token} />
<AnalyticsDashboard token={token} refreshKey={refreshKey} />
      {/* Form */}
      <div className="form">
        <h4>➕ Add New Assignment:</h4>
        <input
          type="text"
          placeholder="Assignment Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
  type="text"
  placeholder="Course (e.g. CPAN 324)"
  value={course}
  onChange={(e) => setCourse(e.target.value)}
/>
<input
  type="number"
  placeholder="Grade (%)"
  min="0"
  max="100"
  value={grade}
  onChange={(e) => setGrade(e.target.value)}
/>
<input
  type="number"
  placeholder="Weight (%)"
  min="0"
  max="100"
  value={weight}
  onChange={(e) => setWeight(e.target.value)}
/>
        <button onClick={addAssignment}>Add Assignment</button>
      </div>

      {/* Assignment List */}
      <div className="list">
        <h2>📋 Your Assignments</h2>

        {assignments.length === 0 ? (
          <p>No assignments yet.</p>
        ) : (
          assignments.map((a, index) => {
            const priority = checkPriority(a.date);

            return (
              <div key={index} className="card">
                <h3>{a.title}</h3>
                <p>Due: {a.date}</p>

                <p style={getPriorityStyle(priority)}>
                  {priority === "CRITICAL" && "🔥 Critical Priority"}
                  {priority === "HIGH" && "⚠️ High Priority"}
                  {priority === "MEDIUM" && "⚡ Medium Priority"}
                  {priority === "LOW" && "✅ Low Priority"}
                </p>

                <button
                  className="deleteBtn"
                  onClick={() => deleteAssignment(index)}
                >
                  Delete
                </button>
              </div>
            );
          })
        )}
        <footer>
      <h4>&copy; 2026 Student Assignment Tracker - By Group 1 - Bolos Bolos, Dustin Nguyen, 
        and Kaynaan Nuur.  All rights reserved.</h4>
    </footer>
      </div>
    </div>
    
  );
}

export default App;
