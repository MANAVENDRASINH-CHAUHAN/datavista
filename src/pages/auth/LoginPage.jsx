import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import FormAlert from "../../components/common/FormAlert";
import AuthPageLayout from "../../components/layout/AuthPageLayout";
import { useAuth } from "../../hooks/useAuth";
import { loginUser } from "../../services/authService";

const initialState = {
  email: "",
  password: "",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuthState } = useAuth();
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      return "Email and password are required";
    }

    const emailPattern = /\S+@\S+\.\S+/;

    if (!emailPattern.test(formData.email)) {
      return "Enter a valid email address";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await loginUser(formData);
      setAuthState({
        token: data.token,
        user: data.user,
      });
      setSuccess("Login successful. Redirecting to dashboard...");
      setFormData(initialState);
      window.setTimeout(() => navigate("/dashboard"), 900);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to login right now"
        : "Unable to login right now";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout
      eyebrow=""
      title=""
      description=""
    >
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
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            className="form-control"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </div>

        <div className="auth-form-links">
          <Link
            to="/forgot-password"
            className="auth-inline-link"
          >
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn auth-submit-btn w-100" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="auth-switch-copy mb-0">
        Don’t have an account?{" "}
        <Link to="/register" className="auth-inline-link">
          Sign Up
        </Link>
      </p>
    </AuthPageLayout>
  );
}
