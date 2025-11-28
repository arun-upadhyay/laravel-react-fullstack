import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const App: React.FC = () => {
  const { user, loading } = useAuth();

  // While we are restoring user from localStorage, show a simple loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top navbar */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/80 flex items-center justify-center text-xs font-bold">
              SA
            </div>
            <span className="font-semibold tracking-tight">
              Laravel API Auth
            </span>
          </div>

          {/* Show different nav items depending on auth state */}
          <nav className="flex items-center gap-4 text-sm">
            {!user && (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full transition ${
                      isActive
                        ? "bg-indigo-500 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full transition ${
                      isActive
                        ? "bg-indigo-500 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`
                  }
                >
                  Register
                </NavLink>
              </>
            )}

            {user && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full transition ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                Dashboard
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex">
        <div className="container flex-1 flex items-center justify-center py-8">
          <Routes>
            {/* If user is already logged in, redirect away from /login */}
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginForm />
                )
              }
            />

            {/* Same for /register */}
            <Route
              path="/register"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <RegisterForm />
                )
              }
            />

            {/* Protected dashboard route */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Default route: if logged in go to dashboard, else go to login */}
            <Route
              path="*"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        React + Laravel + Sanctum · Tailwind UI
      </footer>
    </div>
  );
};

export default App;
