"use client";

import { useState, useEffect } from "react";
import { registerUser, loginUser, getMe, logoutUser, healthCheck, type UserInfo } from "@/lib/auth";

type View = "login" | "register" | "dashboard";

export default function Home() {
  const [view, setView] = useState<View>("login");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    healthCheck()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  const clearMessages = () => { setError(""); setSuccess(""); };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    try {
      const data = await registerUser(
        fd.get("username") as string,
        fd.get("email") as string,
        fd.get("password") as string,
        fd.get("confirmPassword") as string
      );
      setAccessToken(data.tokens.accessToken);
      setUser(data.user);
      setSuccess("Registration successful!");
      setView("dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    try {
      const data = await loginUser(fd.get("email") as string, fd.get("password") as string);
      setAccessToken(data.tokens.accessToken);
      setUser(data.user);
      setSuccess("Login successful!");
      setView("dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (accessToken) {
      try { await logoutUser(accessToken); } catch { /* ignore */ }
    }
    setUser(null);
    setAccessToken(null);
    setView("login");
    setSuccess("Logged out successfully");
  };

  const refreshInfo = async () => {
    if (!accessToken) return;
    try {
      const data = await getMe(accessToken);
      setUser(data.user);
      setSuccess("User info refreshed");
    } catch {
      setError("Session expired");
      handleLogout();
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🔐 Add-Auth Next.js Demo</h1>
        <span
          className={`text-sm px-3 py-1 rounded-full ${
            apiOnline === null
              ? "bg-indigo-900 text-indigo-300"
              : apiOnline
              ? "bg-emerald-900 text-emerald-300"
              : "bg-red-900 text-red-300"
          }`}
        >
          API: {apiOnline === null ? "checking..." : apiOnline ? "online" : "offline"}
        </span>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-900/60 border border-red-800 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-900/60 border border-emerald-800 text-emerald-200 rounded-xl px-4 py-3 mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Login */}
      {view === "login" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-center mb-6">Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Field label="Email" name="email" type="email" placeholder="you@example.com" />
            <Field label="Password" name="password" type="password" placeholder="••••••••" />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-5">
            Don&apos;t have an account?{" "}
            <button onClick={() => { setView("register"); clearMessages(); }} className="text-indigo-400 font-semibold hover:underline">
              Register
            </button>
          </p>
        </div>
      )}

      {/* Register */}
      {view === "register" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-center mb-6">Register</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <Field label="Username" name="username" placeholder="johndoe" minLength={3} maxLength={30} />
            <Field label="Email" name="email" type="email" placeholder="you@example.com" />
            <Field label="Password" name="password" type="password" placeholder="Min 8 chars, A-z, 0-9, !@#$" minLength={8} />
            <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="Repeat password" />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-5">
            Already have an account?{" "}
            <button onClick={() => { setView("login"); clearMessages(); }} className="text-indigo-400 font-semibold hover:underline">
              Login
            </button>
          </p>
        </div>
      )}

      {/* Dashboard */}
      {view === "dashboard" && user && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-center mb-6">Dashboard</h2>
          <div className="flex gap-4 items-start mb-6">
            <div className="w-13 h-13 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold shrink-0">
              {user.email[0].toUpperCase()}
            </div>
            <div className="space-y-1 text-sm text-slate-400 min-w-0">
              <p><span className="text-slate-100 font-medium">Email:</span> {user.email}</p>
              <p><span className="text-slate-100 font-medium">ID:</span>{" "}
                <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded break-all">{user.id}</code>
              </p>
              <p>
                <span className="text-slate-100 font-medium">Status:</span>{" "}
                <span className="bg-emerald-900 text-emerald-300 text-xs px-2 py-0.5 rounded-full">{user.status}</span>
              </p>
              <p><span className="text-slate-100 font-medium">Verified:</span> {user.email_verified ? "✅ Yes" : "❌ No"}</p>
              {user.last_login && (
                <p><span className="text-slate-100 font-medium">Last Login:</span> {new Date(user.last_login).toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshInfo}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Refresh Info
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <footer className="text-center text-xs text-slate-500 mt-8">
        Powered by <strong>@paulweezydesign/add-auth</strong> — Next.js + Tailwind CSS
      </footer>
    </main>
  );
}

const Field = ({
  label, name, type = "text", placeholder, minLength, maxLength,
}: {
  label: string; name: string; type?: string; placeholder?: string; minLength?: number; maxLength?: number;
}) => (
  <div>
    <label htmlFor={name} className="block text-sm text-slate-400 mb-1 font-medium">{label}</label>
    <input
      id={name}
      name={name}
      type={type}
      required
      placeholder={placeholder}
      minLength={minLength}
      maxLength={maxLength}
      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
    />
  </div>
);
