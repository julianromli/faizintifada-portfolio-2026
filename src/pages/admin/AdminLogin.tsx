import { useState, useTransition } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getAdminToken, setAdminToken, verifyAdminCredentials } from '../../lib/admin-api';
import {
  adminBtnPrimary,
  adminInputClass,
  adminLabelClass,
  adminLinkGhost,
  adminTextError,
} from '../../lib/admin-styles';
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin</h1>
        <p className="text-[15px] text-muted mt-2">
          Sign in with <code className="text-[13px]">CMS_ADMIN_TOKEN</code> from your API server. It is verified
          when you continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label id="admin-token-label" htmlFor="admin-token" className={adminLabelClass}>
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
            className={adminInputClass}
            placeholder="Paste CMS_ADMIN_TOKEN"
          />
        </div>
        {error !== null ? <p className={adminTextError}>{error}</p> : null}
        <button type="submit" disabled={isPending} className={`w-full ${adminBtnPrimary}`}>
          {isPending ? 'Checking…' : 'Continue'}
        </button>
      </form>

      <Link to="/" className={`inline-block ${adminLinkGhost}`}>
        Back to site
      </Link>
    </main>
  );
}
