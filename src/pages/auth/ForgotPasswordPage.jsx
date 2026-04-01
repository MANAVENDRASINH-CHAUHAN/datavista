import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import FormAlert from "../../components/common/FormAlert";
import AuthPageLayout from "../../components/layout/AuthPageLayout";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email) {
      setError("Email is required");
      setSuccess("");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address");
      setSuccess("");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await forgotPassword({ email });
      setSuccess("Reset link generated. Open the button below to set a new password.");
      setResetUrl(data.resetUrl || "");
      setError("");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to create reset link right now"
        : "Unable to create reset link right now";
      setError(message);
      setSuccess("");
      setResetUrl("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout eyebrow="" title="" description="">
      <FormAlert type="success" message={success} />
      <FormAlert message={error} />

      <form onSubmit={handleSubmit} noValidate className="auth-form-body">
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>

        <button type="submit" className="btn auth-submit-btn w-100" disabled={isSubmitting}>
          {isSubmitting ? "Generating..." : "Generate Reset Link"}
        </button>
      </form>

      {resetUrl ? (
        <div className="auth-form-links">
          <Link to={resetUrl.replace(window.location.origin, "")} className="btn hero-primary-btn w-100">
            Open Reset Password
          </Link>
        </div>
      ) : null}

      <p className="auth-switch-copy mb-0">
        Remembered your password?{" "}
        <Link to="/login" className="auth-inline-link">
          Login
        </Link>
      </p>
    </AuthPageLayout>
  );
}
