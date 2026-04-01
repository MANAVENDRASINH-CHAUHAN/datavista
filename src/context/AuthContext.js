import { createContext } from "react";

export const AuthContext = createContext({
  auth: null,
  setAuthState: () => {},
  logout: () => {},
  isLoading: true,
});
