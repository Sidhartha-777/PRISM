import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/client';

const DEMO_ACCOUNTS = [
  { email: 'admin@ncpor.gov.in', name: 'Dr. Ravichandran M.', role: 'ADMIN', label: 'Admin', desc: 'Full access — upload, edit, approve editor changes, make content public/private, manage users', color: 'bg-navy-900' },
  { email: 'editor@ncpor.gov.in', name: 'Dr. Thamban Meloth', role: 'EDITOR', label: 'Editor', desc: 'Upload and edit documents, photos, videos — changes require admin approval', color: 'bg-glacier-700' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login({ email: loginEmail, password: loginPassword });
      const role = data.user?.role;
      if (role === 'MEDIA') {
        // Obsolete, fallthrough
        navigate('/admin');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const handleQuickLogin = (account) => {
    setEmail(account.email);
    setPassword('password123');
    handleLogin(account.email, 'password123');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-3 py-6">
      <h1 className="text-h1 mb-2">Staff Login</h1>
      <p className="text-[16px] font-sans text-slate-500 mb-5">Sign in to the NCPOR portal. Your dashboard depends on your role.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Manual login form */}
        <div>
          <h2 className="text-h2 mb-3">Sign In</h2>
          <form onSubmit={handleSubmit} className="bg-white rounded-card border border-line p-4">
            {error && (
              <div className="bg-ember-500/10 border border-ember-500 text-ember-500 text-[13px] font-sans px-3 py-2 rounded-card mb-3">
                {error}
              </div>
            )}
            <div className="mb-3">
              <label htmlFor="email" className="block text-[14px] font-sans text-slate-800 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="user@ncpor.gov.in"
                className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans text-slate-800 focus:border-glacier-500 transition-colors duration-150"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="block text-[14px] font-sans text-slate-800 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans text-slate-800 focus:border-glacier-500 transition-colors duration-150"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-glacier-500 text-white font-sans text-[14px] py-2 rounded-card hover:bg-glacier-700 transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Quick login — demo accounts */}
        <div>
          <h2 className="text-h2 mb-3">Quick Login (Demo Accounts)</h2>
          <p className="text-[13px] font-sans text-slate-500 mb-3">Click any role below to instantly sign in. All use password <span className="font-mono bg-frost-50 border border-line px-1 rounded">password123</span></p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(account => (
              <button
                key={account.email}
                onClick={() => handleQuickLogin(account)}
                disabled={loading}
                className="w-full text-left bg-white rounded-card border border-line p-3 hover:shadow-hover hover:border-glacier-500 transition-all duration-150 disabled:opacity-50 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${account.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-[14px] font-serif font-bold">{account.name.charAt(0)}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-serif font-bold text-navy-900 group-hover:text-glacier-500 transition-colors duration-150">{account.name}</span>
                      <span className={`text-[10px] font-sans text-white px-2 py-0.5 rounded-full ${account.color}`}>{account.label}</span>
                    </div>
                    <p className="text-[12px] font-sans text-slate-500 mt-0.5">{account.desc}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{account.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
