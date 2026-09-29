import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client';

export default function UserManager() {
  const { user } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try { const data = await api.get('/users'); setUsers(data.users || []); } catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (userId === user.id) { setMessage({ type: 'error', text: 'You cannot change your own role.' }); return; }
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setMessage({ type: 'success', text: `Role updated to ${newRole}` });
      await loadUsers();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  };

  const roleColors = {
    ADMIN: 'bg-navy-900', EDITOR: 'bg-glacier-700'
  };

  return (
    <div>
      <h1 className="text-h1 mb-2">User Management</h1>
      <p className="text-[14px] font-sans text-slate-500 mb-4">Manage portal users and their roles. Admins have full access, Editors can create/edit content (requires approval).</p>

      {message && (
        <div className={`mb-4 px-3 py-2 rounded-card text-[13px] font-sans border ${message.type === 'success' ? 'bg-glacier-500/10 border-glacier-500 text-glacier-700' : 'bg-ember-500/10 border-ember-500 text-ember-500'}`}>{message.text}</div>
      )}

      {loading ? <p className="font-sans text-slate-500">Loading...</p> : (
        <div className="bg-white rounded-card border border-line overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-frost-50 border-b border-line">
                <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Name</th>
                <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Email</th>
                <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Role</th>
                <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Joined</th>
                <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-line last:border-0 hover:bg-frost-50/50 transition-colors duration-100">
                  <td className="text-[13px] font-sans text-navy-900 py-2 px-3 font-bold">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${roleColors[u.role]} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-[11px] font-serif font-bold">{u.name?.charAt(0)}</span>
                      </div>
                      {u.name}
                      {u.id === user.id && <span className="text-[10px] font-sans text-aurora-500">(you)</span>}
                    </div>
                  </td>
                  <td className="text-[13px] font-mono text-slate-500 py-2 px-3">{u.email}</td>
                  <td className="py-2 px-3">
                    <span className={`text-[10px] font-sans text-white px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="text-[12px] font-sans text-slate-500 py-2 px-3">{u.createdAt?.split('T')[0]}</td>
                  <td className="py-2 px-3">
                    {u.id !== user.id ? (
                      <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="text-[12px] font-sans border border-line rounded-input px-2 py-1">
                        <option value="ADMIN">Admin</option>
                        <option value="EDITOR">Editor</option>
                      </select>
                    ) : (
                      <span className="text-[12px] font-sans text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
