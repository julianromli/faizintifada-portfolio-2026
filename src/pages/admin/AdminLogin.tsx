import { useState, useTransition } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getAdminToken, setAdminToken, verifyAdminCredentials } from '../../lib/admin-api';
import { normalizeCmsAdminSecret } from '../../lib/normalize-cms-admin-secret';

export function AdminLogin() {
  const navigate = useNavigate();
  const [token, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (getAdminToken()) {
    return <Navigate to="/admin/projects" replace />;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizeCmsAdminSecret(token);
    if (!normalized) {
      setError('Enter the admin token from your server .env (CMS_ADMIN_TOKEN).');
      return;
    }
    startTransition(async () => {
      const result = await verifyAdminCredentials(token);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setAdminToken(token);
      navigate('/admin/projects', { replace: true });
    });
  }

  return (
    <main className="max-w-md mx-auto py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Admin</h1>
        <p className="text-[15px] text-gray-500 mt-2">
          Sign in with <code className="text-[13px]">CMS_ADMIN_TOKEN</code> from your API server. It is verified
          when you continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label id="admin-token-label" htmlFor="admin-token" className="block text-[13px] font-medium text-gray-700 mb-1.5">
            CMS token
          </label>
          <input
            id="admin-token"
            name="admin-token"
            type="password"
            autoComplete="off"
            aria-labelledby="admin-token-label"
            value={token}
            disabled={isPending}
            onChange={(e) => setTokenInput(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:opacity-60"
            placeholder="Paste CMS_ADMIN_TOKEN"
          />
        </div>
        {error !== null ? <p className="text-[14px] text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-gray-900 text-white text-[15px] font-medium py-3 hover:bg-gray-800 active:scale-[0.99] transition-transform disabled:opacity-60 disabled:pointer-events-none"
        >
          {isPending ? 'Checking…' : 'Continue'}
        </button>
      </form>

      <Link
        to="/"
        className="inline-block text-[15px] font-medium text-gray-500 hover:text-gray-900"
      >
        Back to site
      </Link>
    </main>
  );
}
