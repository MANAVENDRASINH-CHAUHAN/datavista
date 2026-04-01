import { apiClient, withAuth } from "./apiClient";

export const registerUser = async (payload) => {
  const response = await apiClient.post("/auth/register", payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await apiClient.post("/auth/login", payload);
  return response.data;
};

export const forgotPassword = async (payload) => {
  const response = await apiClient.post("/auth/forgot-password", payload);
  return response.data;
};

export const resetPassword = async (token, payload) => {
  const response = await apiClient.post(`/auth/reset-password/${token}`, payload);
  return response.data;
};

export const fetchCurrentUser = async (token) => {
  const response = await apiClient.get("/auth/me", withAuth(token));

  return response.data;
};
