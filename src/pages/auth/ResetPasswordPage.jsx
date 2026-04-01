import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import FormAlert from "../../components/common/FormAlert";
import AuthPageLayout from "../../components/layout/AuthPageLayout";
import { resetPassword } from "../../services/authService";

const initialState = {
  password: "",
  confirmPassword: "",
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      setError("Password and confirm password are required");
      setSuccess("");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setSuccess("");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setSuccess("");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await resetPassword(token, formData);
      setSuccess(data.message || "Password reset successful");
      setError("");
      setFormData(initialState);
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to reset password right now"
        : "Unable to reset password right now";
      setError(message);
      setSuccess("");
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
          <label htmlFor="password" className="form-label">
            New Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            className="form-control"
            placeholder="Enter new password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            className="form-control"
            placeholder="Repeat new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn auth-submit-btn w-100" disabled={isSubmitting}>
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <p className="auth-switch-copy mb-0">
        Back to{" "}
        <Link to="/login" className="auth-inline-link">
          Login
        </Link>
      </p>
    </AuthPageLayout>
  );
}
