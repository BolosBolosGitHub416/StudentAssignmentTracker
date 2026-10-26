import { useState, useEffect } from "react";
import "./App.css";
import Announcements from "./Announcements";
import Chat from "./Chat";
import AnalyticsDashboard from "./AnalyticsDashboard";
import NotificationCenter from "./NotificationCenter";
import Login from "./Login";
import About from "./About";

{/* Read user from localStorage */}
function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
}
{/* Main App component */}
function App() {
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [course, setCourse] = useState("");
  const [grade, setGrade] = useState("");
  const [weight, setWeight] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [token, setToken] = useState(() =>
    readUser() ? localStorage.getItem("token") || "" : ""
  );
  const [refreshKey, setRefreshKey] = useState(0);

useEffect(() => {
  if (!token) return;
 {/* Load assignments from the backend API */}
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
{/* User authentication state */}
const [user, setUser] = useState(readUser);
{/* Handle user login and logout */}
const handleLogin = (newToken, newUser) => {
  localStorage.setItem("token", newToken);
  localStorage.setItem("user", JSON.stringify(newUser));
  setToken(newToken);
  setUser(newUser);
};

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setToken("");
  setUser(null);
};

  // Load saved data


  // Save data
  useEffect(() => {
    localStorage.setItem("assignments", JSON.stringify(assignments));
  }, [assignments]);

{/* Add a new assignment */}
const addAssignment = async () => {
  if (!title || !date) return;

  if (!token) {
    alert("Please log in first.");
    return;
  }
{/* Send a POST request to the backend API to add the assignment */}
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
    {/* Update the assignments state with the new assignment */}
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


  {/* Delete an assignment */}
const deleteAssignment = async (assignment) => {
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

    setAssignments((prev) => prev.filter((item) => item.id !== assignment.id));
setRefreshKey((prev) => prev + 1);
    alert("Assignment deleted successfully!");
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

  {/* Check the priority of an assignment based on its due date */}
  const checkPriority = (date) => {
    const today = new Date();
    const due = new Date(date);
    const diff = (due - today) / (1000 * 60 * 60 * 24);

    if (diff <= 1) return "CRITICAL";
    if (diff <= 2) return "HIGH";
    if (diff <= 5) return "MEDIUM";
    return "LOW";
  };
  {/* Get the style for the priority label */}
  const getPriorityStyle = (priority) => {
    if (priority === "CRITICAL") return { color: "#d50000" };
    if (priority === "HIGH") return { color: "#fb8c00" };
    if (priority === "MEDIUM") return { color: "#ffeb3b" };
    return { color: "#43a047" };
  };
  {/* Filter assignments based on the search term */}
  const searchTerm = assignmentSearch.trim().toLowerCase();
  const filteredAssignments = assignments.filter((assignment) =>
    [assignment.title, assignment.course]
      .some((value) => value?.toLowerCase().includes(searchTerm))
  );

  if (!token || !user) {
    return (
      <div className="app-shell">
        <Login onLogin={handleLogin} />
      </div>
    );
  }
    {/* Due date formatting function */}
  const formatDueDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "EST",
    });

  return (
    <div className="container">
      <h1>Student Assignment Tracker</h1>

      <h4> Welcome to Student Assignment Tracker! </h4>
      <p> Student Assignment Tracker is currently in a work in progress,
         and will be updated frequently in the future. </p>
      
      <div>
        <ul>
          <li><a href="/">Home</a></li>
          <li><button className="text-button" onClick={handleLogout} type="button">Sign out</button></li>
        </ul>
      </div>

      {/* Announcement Board */}
      <NotificationCenter token={token} /> {/* Notification Center Component */ }
      <Announcements token={token} user={user} /> {/* Announcements Component */}
      <Chat token={token} /> {/* Chat Component */}
<AnalyticsDashboard token={token} refreshKey={refreshKey} /> {/* Analytics Dashboard */}
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
        {/* Assignment Search */}
        <label className="assignment-search">
          <span>Search by assignment title (e.g. Project Phase 2) or course (e.g. CPAN 324):</span>
          <input
            type="search"
            value={assignmentSearch}
            onChange={(event) => setAssignmentSearch(event.target.value)}
            placeholder="e.g. Assignment title or CPAN 324"
          />
        </label>

        {assignments.length === 0 ? (
          <p>No assignments yet.</p>
        ) : filteredAssignments.length === 0 ? (
          <p>No assignments match “{assignmentSearch}”.</p>
        ) : (
          filteredAssignments.map((a) => {
            const priority = checkPriority(a.date);

            return (
              <div key={a.id} className="card">
                <h3>{a.title}</h3>
                <p>Due Date: {formatDueDate(a.date)}</p>

                <p style={getPriorityStyle(priority)}>
                  {priority === "CRITICAL" && "🔥 Critical Priority"}
                  {priority === "HIGH" && "⚠️ High Priority"}
                  {priority === "MEDIUM" && "⚡ Medium Priority"}
                  {priority === "LOW" && "✅ Low Priority"}
                </p>

                <button
                  className="deleteBtn"
                  onClick={() => deleteAssignment(a)}
                >
                  Delete
                </button>
              </div>
            );
          })
        )}
        <About />
        <footer>
      <h4>&copy; 2026 Student Assignment Tracker - By Group 1 - Bolos Bolos, Dustin Nguyen, 
        and Kaynaan Nuur.  All rights reserved.</h4>
    </footer>
      </div>
    </div>
    
  );
}

export default App;