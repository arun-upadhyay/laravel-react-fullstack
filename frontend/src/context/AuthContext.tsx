import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
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

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const idleTimerRef = useRef<number | null>(null);

  // Load user on first render
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  // Inactivity handling
  useEffect(() => {
    if (!user) {
      // no user = no need to track inactivity
      clearIdleTimer();
      return;
    }

    function resetTimer() {
      clearIdleTimer();
      idleTimerRef.current = window.setTimeout(() => {
        handleInactivityLogout();
      }, INACTIVITY_TIMEOUT_MS);
    }

    function clearIdleTimer() {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    }

    async function handleInactivityLogout() {
      try {
        await logoutApi();
      } catch {
        // ignore server error
      }
      logoutLocal();
      setUser(null);
      clearIdleTimer();
      // Optionally, show toast like "Logged out due to inactivity"
    }

    // Listen for user interactions
    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Start first timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      clearIdleTimer();
    };
  }, [user]);

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
      // ignore api failure
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
