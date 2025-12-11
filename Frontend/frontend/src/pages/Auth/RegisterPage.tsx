import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApi } from '../../api/authApi';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: typeof fieldErrors = {};

    if (!username.trim()) {
      errs.username = 'Username is required.';
    }
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters long.';
    }
    if (!passwordConfirm) {
      errs.passwordConfirm = 'Please confirm the password.';
    } else if (password !== passwordConfirm) {
      errs.passwordConfirm = 'Passwords do not match.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validate()) return;

    setLoading(true);
    try {
      await AuthApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      setSuccess(true);
      // Opcional: redirigir automáticamente al login después de un tiempo
      setTimeout(() => {
        navigate('/login', { replace: true, state: { username } });
      }, 1000);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        'Registration failed. Please check your data or try again later.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md px-6 py-8 bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
            <span className="text-2xl font-semibold tracking-wide text-slate-50">
              cinema
            </span>
          </div>
          <h2 className="text-lg font-medium text-slate-300">
            Create your account
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-200 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-red-300">
                {fieldErrors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-200 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-300">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-200 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 pr-10 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
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
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-300">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Password confirm */}
          <div>
            <label
              htmlFor="passwordConfirm"
              className="block text-sm font-medium text-slate-200 mb-1"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 pr-10 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
              />
              <button
                type="button"
                aria-label={
                  showPasswordConfirm ? 'Hide password' : 'Show password'
                }
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
                onClick={() => setShowPasswordConfirm(prev => !prev)}
              >
                {showPasswordConfirm ? (
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
            {fieldErrors.passwordConfirm && (
              <p className="mt-1 text-xs text-red-300">
                {fieldErrors.passwordConfirm}
              </p>
            )}
          </div>

          {/* Error global */}
          {error && (
            <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Account created successfully. Redirecting to login…
            </div>
          )}

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-500/30 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading && (
                <span className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
              )}
              <span>Create account</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-red-400 hover:text-red-300 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
