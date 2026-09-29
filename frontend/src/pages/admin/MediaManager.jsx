import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client';

export default function MediaManager() {
  const { user } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [albums, setAlbums] = useState([]);

  const loadItems = async () => {
    setLoading(true);
    try { const data = await api.get('/media/admin/all'); setItems(data.items || []); } catch { setItems([]); }
    setLoading(false);
  };

  const loadAlbums = async () => {
    try { const data = await api.get('/media/albums/list'); setAlbums(data.albums || []); } catch {}
  };

  useEffect(() => { loadItems(); loadAlbums(); }, []);

  const blankForm = {
    title: '', title_hi: '', description: '', description_hi: '', media_type: 'PHOTO',
    credit: '', location: '', taken_date: '', licence: 'CC-BY-4.0', album_id: '',
  };

  const [form, setForm] = useState(blankForm);

  const handleNew = () => { setMessage({ type: 'error', text: 'Please use the New Entry section to add media.' }); };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || '', title_hi: item.title_hi || '', description: item.description || '',
      description_hi: item.description_hi || '', media_type: item.media_type || 'PHOTO',
      credit: item.credit || '', location: item.location || '', taken_date: item.taken_date || '',
      licence: item.licence || 'CC-BY-4.0', album_id: item.album_id || '',
    });
    setShowForm(true); setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) { await api.put(`/media/${editItem.id}`, form); }
      else { await api.post('/media', form); }
      const isEditor = user.role === 'EDITOR';
      setMessage({ type: 'success', text: isEditor ? 'Submitted for admin approval!' : (editItem ? 'Media updated!' : 'Media created!') });
      setShowForm(false); await loadItems();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    setSaving(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await api.put(`/media/${id}`, { status: newStatus }); setMessage({ type: 'success', text: `Status → ${newStatus}` }); await loadItems(); }
    catch (err) { setMessage({ type: 'error', text: err.message }); }
  };

  const statusColors = { DRAFT: 'bg-slate-500', IN_REVIEW: 'bg-aurora-500', APPROVED: 'bg-glacier-700', PUBLISHED: 'bg-glacier-500', ARCHIVED: 'bg-slate-800', PRIVATE: 'bg-slate-800' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-h1">Media Library</h1>
          <p className="text-[14px] font-sans text-slate-500 mt-1">{user.role === 'EDITOR' ? 'Add media items. Changes require admin approval.' : 'Manage photos and videos.'}</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-3 py-2 rounded-card text-[13px] font-sans border ${message.type === 'success' ? 'bg-glacier-500/10 border-glacier-500 text-glacier-700' : 'bg-ember-500/10 border-ember-500 text-ember-500'}`}>{message.text}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-card border border-line p-5 w-full max-w-[600px] shadow-lg mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2">{editItem ? 'Edit Media' : 'New Media Item'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-800 text-[20px]">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Type</label>
                  <select value={form.media_type} onChange={e => setForm({...form, media_type: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans">
                    <option value="PHOTO">Photo</option><option value="VIDEO">Video</option></select></div>
              </div>
              <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Credit / Photographer</label>
                  <input value={form.credit} onChange={e => setForm({...form, credit: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Date Taken</label>
                  <input type="date" value={form.taken_date} onChange={e => setForm({...form, taken_date: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" /></div>
                <div><label className="block text-[13px] font-sans text-slate-800 mb-1">Album</label>
                  <select value={form.album_id} onChange={e => setForm({...form, album_id: e.target.value})} className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans">
                    <option value="">None</option>{albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              </div>
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
        <div className="bg-white rounded-card border border-line p-4"><p className="text-[14px] font-sans text-slate-500">No media items yet.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-card border border-line p-3 hover:shadow-hover transition-shadow duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-sans text-white px-2 py-0.5 rounded-full ${item.media_type === 'PHOTO' ? 'bg-aurora-500' : 'bg-glacier-700'}`}>{item.media_type}</span>
                <span className={`text-[10px] font-sans text-white px-2 py-0.5 rounded-full ${statusColors[item.status] || 'bg-slate-500'}`}>{item.status === 'ARCHIVED' ? 'PRIVATE' : item.status}</span>
              </div>
              <h3 className="text-[14px] font-serif font-bold text-navy-900 mb-1 truncate">{item.title}</h3>
              <p className="text-[12px] font-sans text-slate-500 mb-1 truncate">{item.credit ? `📷 ${item.credit}` : ''} {item.location ? `📍 ${item.location}` : ''}</p>
              {item.album_name && <p className="text-[11px] font-sans text-aurora-500 mb-2">Album: {item.album_name}</p>}
              <div className="flex items-center gap-1 pt-1 border-t border-line">
                <button onClick={() => handleEdit(item)} className="text-[12px] font-sans text-glacier-500 hover:underline">Edit</button>
                {user.role === 'ADMIN' && item.status === 'DRAFT' && <button onClick={() => handleStatusChange(item.id, 'PUBLISHED')} className="text-[12px] font-sans text-aurora-500 hover:underline ml-2">Publish</button>}
                {user.role === 'ADMIN' && item.status === 'PUBLISHED' && <button onClick={() => handleStatusChange(item.id, 'ARCHIVED')} className="text-[12px] font-sans text-ember-500 hover:underline ml-2">Keep Private</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
