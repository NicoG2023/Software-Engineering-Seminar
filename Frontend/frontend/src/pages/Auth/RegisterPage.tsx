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
  <div className="min-h-screen flex items-center justify-center bg-[#EEF1F5] px-4">
    <div className="w-full max-w-md px-8 py-10 bg-white rounded-2xl shadow-xl border border-gray-200">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-xl shadow-md">
              C
            </div>
          <span className="text-2xl font-semibold tracking-wide text-gray-800">
            cinema
          </span>
        </div>
        <h2 className="text-sm font-medium text-gray-500">
          Create your account
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent text-sm"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          {fieldErrors.username && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent text-sm"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 pr-10 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent text-sm"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            {/* Show/hide icon */}
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <span className="material-icons-outlined text-base">visibility_off</span>
              ) : (
                <span className="material-icons-outlined text-base">visibility</span>
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-semibold text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 pr-10 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent text-sm"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(prev => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            >
              {showPasswordConfirm ? (
                <span className="material-icons-outlined text-base">visibility_off</span>
              ) : (
                <span className="material-icons-outlined text-base">visibility</span>
              )}
            </button>
          </div>
          {fieldErrors.passwordConfirm && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.passwordConfirm}</p>
          )}
        </div>

        {/* Global Error */}
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-2 text-sm text-emerald-700">
            Account created successfully. Redirecting…
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#4F46E5] disabled:opacity-60 transition"
        >
          {loading && (
            <span className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
          )}
          <span>Create account</span>
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-[#6366F1] hover:text-[#4F46E5] font-medium">
          Sign in
        </Link>
      </p>
    </div>
  </div>
);
}
