import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import FormAlert from "../../components/common/FormAlert";
import AuthPageLayout from "../../components/layout/AuthPageLayout";
import { useAuth } from "../../hooks/useAuth";
import { registerUser } from "../../services/authService";

const initialState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "user",
};

export default function RegisterPage() {
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
    if (!formData.name || !formData.email || !formData.password) {
      return "Name, email, and password are required";
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return "Enter a valid email address";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
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
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      const data = await registerUser(payload);
      setAuthState({
        token: data.token,
        user: data.user,
      });
      setSuccess("Registration successful. Redirecting to dashboard...");
      setFormData(initialState);
      window.setTimeout(() => navigate("/dashboard"), 900);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to register right now"
        : "Unable to register right now";
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
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              className="form-control"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>

          <div className="col-md-6">
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

          <div className="col-md-6">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              className="form-control"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              className="form-control"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <div className="col-12">
            <label htmlFor="role" className="form-label">
              Role
            </label>
            <select
              id="role"
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">User</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn auth-submit-btn w-100 mt-4" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="auth-switch-copy mb-0">
        Already have an account?{" "}
        <Link to="/login" className="auth-inline-link">
          Login
        </Link>
      </p>
    </AuthPageLayout>
  );
}
