import { useState } from "react";
import { apiFetch } from "./api";

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await apiFetch(
        isRegistering ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          body: isRegistering
            ? form
            : { email: form.email, password: form.password },
        },
      );
      onLogin(result);
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">STUDENT ASSIGNMENT TRACKER</p>
        <h2>{isRegistering ? "Create your account" : "Welcome back"}</h2>
        <p className="auth-description">
          {isRegistering
            ? "Create an account to start tracking your coursework."
            : "Sign in to manage your assignments and deadlines."}
        </p>

        {isRegistering && (
          <div className="auth-name-fields">
            <label>
              First name
              <input
                autoComplete="given-name"
                name="firstName"
                onChange={updateField}
                required
                value={form.firstName}
              />
            </label>
            <label>
              Last name
              <input
                autoComplete="family-name"
                name="lastName"
                onChange={updateField}
                required
                value={form.lastName}
              />
            </label>
          </div>
        )}

        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            onChange={updateField}
            required
            type="email"
            value={form.email}
          />
        </label>
        <label>
          Password
          <input
            autoComplete={isRegistering ? "new-password" : "current-password"}
            name="password"
            onChange={updateField}
            required
            type="password"
            value={form.password}
          />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? "Please wait..."
            : isRegistering
              ? "Create account"
              : "Sign in"}
        </button>
        <button
          className="text-button"
          onClick={() => {
            setIsRegistering((current) => !current);
            setError("");
          }}
          type="button"
        >
          {isRegistering
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </form>
    </main>
  );
}

export default Login;
