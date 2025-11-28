import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState<string>("Loading...");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ message: string }>("/dashboard");
        setMessage(res.data.message);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load dashboard");
      }
    }
    load();
  }, []);

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl shadow-slate-900/40 p-6 sm:p-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 mb-1">
              Dashboard
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              You are authenticated via Laravel Sanctum.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 transition"
          >
            Logout
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs text-slate-400 mb-1">API message</p>
            <p className="text-sm text-slate-100">{message}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs text-slate-400 mb-1">User info</p>
            <p className="text-sm text-slate-100">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p className="text-sm text-slate-100 mt-1">
              <span className="font-medium">ID:</span> {user?.id}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
