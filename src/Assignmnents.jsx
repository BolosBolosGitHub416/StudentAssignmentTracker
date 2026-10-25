import { useEffect, useState } from "react";
import { apiFetch } from "./api";

const emptyForm = {
  title: "",
  course: "",
  weight: "",
  dueDate: "",
  status: "assigned",
  grade: "",
};

function Assignmnents({ token, user }) {
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    apiFetch("/api/assignments", { token })
      .then((data) => {
        if (active) setAssignments(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const created = await apiFetch("/api/assignments", {
        token,
        method: "POST",
        body: {
          ...form,
          weight: Number(form.weight),
          grade: form.grade === "" ? null : Number(form.grade),
        },
      });
      setAssignments((current) => [created, ...current]);
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="assignment-section">
      <div className="section-heading">
        <p className="eyebrow">YOUR COURSEWORK</p>
        <h2>Assignments</h2>
        <p>Create and track assignments tied to your student account.</p>
      </div>

      {user?.role === "student" && (
        <form className="assignment-form" onSubmit={submit}>
          <label>
            Assignment
            <input
              name="title"
              onChange={updateField}
              placeholder="e.g. Research paper"
              required
              value={form.title}
            />
          </label>
          <label>
            Course
            <input
              name="course"
              onChange={updateField}
              placeholder="e.g. Biology 101"
              required
              value={form.course}
            />
          </label>
          <label>
            Weight (%)
            <input
              max="100"
              min="0"
              name="weight"
              onChange={updateField}
              required
              type="number"
              value={form.weight}
            />
          </label>
          <label>
            Due date
            <input
              name="dueDate"
              onChange={updateField}
              required
              type="date"
              value={form.dueDate}
            />
          </label>
          <label>
            Status
            <select name="status" onChange={updateField} value={form.status}>
              <option value="assigned">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label>
            Grade (%)
            <input
              max="100"
              min="0"
              name="grade"
              onChange={updateField}
              placeholder="Not graded"
              type="number"
              value={form.grade}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving ? "Saving..." : "Add assignment"}
          </button>
        </form>
      )}

      <div className="assignment-list">
        {isLoading ? (
          <p>Loading your assignments...</p>
        ) : assignments.length === 0 ? (
          <p>No assignments yet. Add your first assignment above.</p>
        ) : (
          assignments.map((assignment) => (
            <article className="assignment-card" key={assignment.id}>
              <div>
                <h3>{assignment.title}</h3>
                <p>{assignment.course || "Course not specified"}</p>
              </div>
              <dl>
                <div>
                  <dt>Due</dt>
                  <dd>{assignment.dueDate}</dd>
                </div>
                <div>
                  <dt>Weight</dt>
                  <dd>{assignment.weight ?? "—"}{assignment.weight != null && "%"}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{assignment.status?.replaceAll("_", " ") || "assigned"}</dd>
                </div>
                <div>
                  <dt>Grade</dt>
                  <dd>{assignment.grade == null ? "Not graded" : `${assignment.grade}%`}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default Assignmnents;
