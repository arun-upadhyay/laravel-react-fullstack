import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const App: React.FC = () => {
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
          <nav className="flex items-center gap-4 text-sm">
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
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full transition hidden sm:inline-block ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex">
        <div className="container flex-1 flex items-center justify-center py-8">
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<LoginForm />} />
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
