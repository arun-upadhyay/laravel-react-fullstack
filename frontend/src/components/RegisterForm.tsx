import React, { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const RegisterForm: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState<string>("Test User");
  const [email, setEmail] = useState<string>("test2@example.com");
  const [password, setPassword] = useState<string>("password");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState<string>("password");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(name, email, password, passwordConfirmation);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.errors) {
        const firstError =
          Object.values(err.response.data.errors)[0] as string[];
        setError(firstError[0]);
      } else {
        setError("Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl shadow-slate-900/40 p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Create account
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Register and start using your Laravel API.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200">
              Name
            </label>
            <input
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/60 text-sm font-medium text-white py-2.5 mt-2 transition-colors"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
