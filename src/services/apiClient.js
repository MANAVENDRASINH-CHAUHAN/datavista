import axios from "axios";

const DEFAULT_API_URL = "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL,
});

export const withAuth = (token, config = {}) => ({
  ...config,
  headers: {
    Authorization: `Bearer ${token}`,
    ...(config.headers || {}),
  },
});
