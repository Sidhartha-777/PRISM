import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client';

export default function PublicationManager() {
  const { user } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.get('/publications/admin/all');
      setItems(data.publications || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []);

  const blankForm = {
    title: '', title_hi: '', abstract: '', abstract_hi: '', pub_type: 'PAPER',
    authors: '', journal: '', year: new Date().getFullYear(), volume: '', issue: '',
    pages: '', doi: '', keywords: '',
  };

  const [form, setForm] = useState(blankForm);

  const handleNew = () => { setMessage({ type: 'error', text: 'Please use the New Entry section to add publications.' }); };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || '', title_hi: item.title_hi || '', abstract: item.abstract || '',
      abstract_hi: item.abstract_hi || '', pub_type: item.pub_type || 'PAPER',
      authors: item.authors || '', journal: item.journal || '', year: item.year || '',
      volume: item.volume || '', issue: item.issue || '', pages: item.pages || '',
      doi: item.doi || '', keywords: item.keywords || '',
    });
    setShowForm(true); setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) { await api.put(`/publications/${editItem.id}`, form); }
      else { await api.post('/publications', form); }
      const isEditor = user.role === 'EDITOR';
      setMessage({ type: 'success', text: isEditor ? 'Submitted for admin approval!' : (editItem ? 'Publication updated!' : 'Publication created!') });
      setShowForm(false); await loadItems();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    setSaving(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await api.put(`/publications/${id}`, { status: newStatus }); setMessage({ type: 'success', text: `Status → ${newStatus}` }); await loadItems(); }
    catch (err) { setMessage({ type: 'error', text: err.message }); }
  };

  const statusColors = { DRAFT: 'bg-slate-500', IN_REVIEW: 'bg-aurora-500', APPROVED: 'bg-glacier-700', PUBLISHED: 'bg-glacier-500', ARCHIVED: 'bg-slate-800', PRIVATE: 'bg-slate-800' };
  const pubTypes = ['PAPER', 'TECHNICAL_REPORT', 'ANNUAL_REPORT', 'NEWSLETTER', 'BOOK'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-h1">Publication Manager</h1>
          <p className="text-[14px] font-sans text-slate-500 mt-1">{user.role === 'EDITOR' ? 'Add publications. Changes require admin approval.' : 'Manage all publications.'}</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-3 py-2 rounded-card text-[13px] font-sans border ${message.type === 'success' ? 'bg-glacier-500/10 border-glacier-500 text-glacier-700' : 'bg-ember-500/10 border-ember-500 text-ember-500'}`}>{message.text}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-card border border-line p-5 w-full max-w-[700px] shadow-lg mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2">{editItem ? 'Edit Publication' : 'New Publication'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-800 text-[20px]">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Type</label>
                  <select value={form.pub_type} onChange={e => setForm({...form, pub_type: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans">
                    {pubTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Authors</label>
                <input value={form.authors} onChange={e => setForm({...form, authors: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" placeholder="e.g. Thamban M., Singh A.K." /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Journal</label>
                  <input value={form.journal} onChange={e => setForm({...form, journal: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Year</label>
                  <input type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">DOI</label>
                  <input value={form.doi} onChange={e => setForm({...form, doi: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Volume</label>
                  <input value={form.volume} onChange={e => setForm({...form, volume: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Issue</label>
                  <input value={form.issue} onChange={e => setForm({...form, issue: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Pages</label>
                  <input value={form.pages} onChange={e => setForm({...form, pages: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" placeholder="e.g. 1-15" /></div>
              </div>
              <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Abstract</label>
                <textarea value={form.abstract} onChange={e => setForm({...form, abstract: e.target.value})} rows={3} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
              <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Keywords</label>
                <input value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" placeholder="comma-separated" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="bg-glacier-500 text-white font-sans text-[14px] px-5 py-2 rounded-card hover:bg-glacier-700 transition-colors duration-150 disabled:opacity-50">
                  {saving ? 'Saving...' : (user.role === 'EDITOR' ? 'Submit for Approval' : (editItem ? 'Update' : 'Create'))}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-white text-slate-500 border border-line font-sans text-[14px] px-5 py-2 rounded-card hover:bg-frost-50 transition-colors duration-150">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <p className="font-sans text-slate-500">Loading...</p> : items.length === 0 ? (
        <div className="bg-white rounded-card border border-line p-4"><p className="text-[14px] font-sans text-slate-500">No publications yet.</p></div>
      ) : (
        <div className="bg-white rounded-card border border-line overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full text-left"><thead><tr className="bg-frost-50 border-b border-line">
            <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Title</th>
            <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Type</th>
            <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Authors</th>
            <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Year</th>
            <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Status</th>
            <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Actions</th>
          </tr></thead><tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-line last:border-0 hover:bg-frost-50/50 transition-colors duration-100">
                <td className="text-[13px] font-sans text-navy-900 py-2 px-3 font-bold max-w-[250px] truncate">{item.title}</td>
                <td className="text-[12px] font-sans text-slate-500 py-2 px-3">{item.pub_type?.replace(/_/g, ' ')}</td>
                <td className="text-[12px] font-sans text-slate-500 py-2 px-3 max-w-[150px] truncate">{item.authors}</td>
                <td className="text-[13px] font-sans text-slate-500 py-2 px-3">{item.year}</td>
                <td className="py-2 px-3"><span className={`text-[10px] font-sans text-white px-2 py-0.5 rounded-full ${statusColors[item.status] || 'bg-slate-500'}`}>{item.status === 'ARCHIVED' ? 'PRIVATE' : item.status}</span></td>
                <td className="py-2 px-3"><div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(item)} className="text-[12px] font-sans text-glacier-500 hover:underline">Edit</button>
                  {user.role === 'ADMIN' && item.status === 'DRAFT' && <button onClick={() => handleStatusChange(item.id, 'PUBLISHED')} className="text-[12px] font-sans text-aurora-500 hover:underline ml-2">Publish</button>}
                  {user.role === 'ADMIN' && item.status === 'PUBLISHED' && <button onClick={() => handleStatusChange(item.id, 'ARCHIVED')} className="text-[12px] font-sans text-ember-500 hover:underline ml-2">Keep Private</button>}
                </div></td>
              </tr>
            ))}
          </tbody></table>
        </div></div>
      )}
    </div>
  );
}
