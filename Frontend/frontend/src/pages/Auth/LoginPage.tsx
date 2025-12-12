import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStrict } from '../../auth/AuthContext';

type LocationState = {
  from?: { pathname?: string };
};

export default function LoginPage() {
  const { login, authenticated } = useAuthStrict();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const from = state.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // If user is already authenticated, just redirect back
  if (authenticated) {
    navigate(from, { replace: true });
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md px-6 py-8 bg-white rounded-2xl shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-xl shadow-md">
              C
            </div>
            <span className="text-2xl font-semibold tracking-wide text-slate-900">
              cinema
            </span>
          </div>
          <h2 className="text-sm font-medium text-slate-600">
            Sign in to your account to manage shows, tickets and rooms.
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-slate-800 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-800 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? (
                  // eye-off
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 4.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.51 18.51 0 0 1-2.16 3.19" />
                    <path d="M14.12 9.88a3 3 0 0 1 0 4.24" />
                    <path d="M9.88 9.88a3 3 0 0 0 0 4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // eye
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-50"
            >
              {loading && (
                <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              )}
              <span>Sign in</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
