import { useEffect, useState } from "react";

import { AuthContext } from "./AuthContext";
import { fetchCurrentUser } from "../services/authService";

const AUTH_STORAGE_KEY = "datavista_auth";

const readStoredAuth = () => {
  const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawAuth) {
    return null;
  }

  try {
    return JSON.parse(rawAuth);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const writeStoredAuth = (auth) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
};

const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStoredAuth());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreStoredSession = async () => {
      const storedAuth = readStoredAuth();

      if (!storedAuth?.token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchCurrentUser(storedAuth.token);
        const nextAuth = {
          token: storedAuth.token,
          user: response.user,
        };

        setAuth(nextAuth);
        writeStoredAuth(nextAuth);
      } catch {
        clearStoredAuth();
        setAuth(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreStoredSession();
  }, []);

  const setAuthState = (nextAuth) => {
    setAuth(nextAuth);

    if (nextAuth) {
      writeStoredAuth(nextAuth);
      return;
    }

    clearStoredAuth();
  };

  const logout = () => {
    setAuthState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuthState,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
