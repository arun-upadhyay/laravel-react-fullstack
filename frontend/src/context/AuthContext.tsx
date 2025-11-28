import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { User } from "../types/auth";
import {
  getStoredUser,
  login as apiLogin,
  register as apiRegister,
  logoutApi,
  logoutLocal,
} from "../api/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user from localStorage on first render
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  async function handleLogin(email: string, password: string) {
    const loggedInUser = await apiLogin(email, password);
    setUser(loggedInUser);
  }

  async function handleRegister(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) {
    const newUser = await apiRegister(name, email, password, passwordConfirmation);
    setUser(newUser);
  }

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // ignore api failure, still clear local
    }
    logoutLocal();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
