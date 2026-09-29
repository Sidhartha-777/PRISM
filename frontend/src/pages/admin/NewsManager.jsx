import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client';

export default function NewsManager() {
  const { user } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadItems = async () => {
    setLoading(true);
    try { const data = await api.get('/news/admin/all'); setItems(data.articles || []); } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []);

  const blankForm = {
    title: '', title_hi: '', summary: '', summary_hi: '', body: '', body_hi: '',
    publish_date: new Date().toISOString().split('T')[0],
  };

  const [form, setForm] = useState(blankForm);

  const handleNew = () => { setEditItem(null); setForm(blankForm); setShowForm(true); setMessage(null); };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || '', title_hi: item.title_hi || '', summary: item.summary || '',
      summary_hi: item.summary_hi || '', body: item.body || '', body_hi: item.body_hi || '',
      publish_date: item.publish_date || '',
    });
    setShowForm(true); setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) { await api.put(`/news/${editItem.id}`, form); }
      else { await api.post('/news', form); }
      const isEditor = user.role === 'EDITOR';
      setMessage({ type: 'success', text: isEditor ? 'Submitted for admin approval!' : (editItem ? 'Article updated!' : 'Article created!') });
      setShowForm(false); await loadItems();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    setSaving(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await api.put(`/news/${id}`, { status: newStatus }); setMessage({ type: 'success', text: `Status → ${newStatus}` }); await loadItems(); }
    catch (err) { setMessage({ type: 'error', text: err.message }); }
  };

  const statusColors = { DRAFT: 'bg-slate-500', IN_REVIEW: 'bg-aurora-500', APPROVED: 'bg-glacier-700', PUBLISHED: 'bg-glacier-500', ARCHIVED: 'bg-slate-800', PRIVATE: 'bg-slate-800' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-h1">News Editor</h1>
          <p className="text-[14px] font-sans text-slate-500 mt-1">{user.role === 'EDITOR' ? 'Write articles. Submissions require admin approval.' : 'Manage all news articles.'}</p>
        </div>
        <button onClick={handleNew} className="bg-glacier-500 text-white font-sans text-[14px] px-4 py-2 rounded-card hover:bg-glacier-700 transition-colors duration-150">+ New Article</button>
      </div>

      {message && (
        <div className={`mb-4 px-3 py-2 rounded-card text-[13px] font-sans border ${message.type === 'success' ? 'bg-glacier-500/10 border-glacier-500 text-glacier-700' : 'bg-ember-500/10 border-ember-500 text-ember-500'}`}>{message.text}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-card border border-line p-5 w-full max-w-[700px] shadow-lg mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2">{editItem ? 'Edit Article' : 'New Article'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-800 text-[20px]">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Publish Date</label>
                  <input type="date" value={form.publish_date} onChange={e => setForm({...form, publish_date: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
              </div>
              <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Summary</label>
                <textarea value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} rows={2} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
              <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Body</label>
                <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} rows={6} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
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
        <div className="bg-white rounded-card border border-line p-4"><p className="text-[14px] font-sans text-slate-500">No articles yet.</p></div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-card border border-line p-4 hover:shadow-hover transition-shadow duration-150">
              <div className="flex items-start justify-between">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-sans text-white px-2 py-0.5 rounded-full ${statusColors[item.status] || 'bg-slate-500'}`}>{item.status === 'ARCHIVED' ? 'PRIVATE' : item.status}</span>
                    {item.publish_date && <span className="text-[11px] font-sans text-slate-500">{item.publish_date}</span>}
                  </div>
                  <h3 className="text-[16px] font-serif font-bold text-navy-900 mb-1">{item.title}</h3>
                  {item.summary && <p className="text-[13px] font-sans text-slate-500 line-clamp-2">{item.summary}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <button onClick={() => handleEdit(item)} className="text-[12px] font-sans text-glacier-500 hover:underline">Edit</button>
                  {user.role === 'ADMIN' && item.status === 'DRAFT' && <button onClick={() => handleStatusChange(item.id, 'PUBLISHED')} className="text-[12px] font-sans text-aurora-500 hover:underline ml-2">Publish</button>}
                  {user.role === 'ADMIN' && item.status === 'PUBLISHED' && <button onClick={() => handleStatusChange(item.id, 'ARCHIVED')} className="text-[12px] font-sans text-ember-500 hover:underline ml-2">Keep Private</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
