import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client';

export default function ExpeditionManager() {
  const { user } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [stations, setStations] = useState([]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.get('/expeditions/admin/all');
      setItems(data.expeditions || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  const loadStations = async () => {
    try {
      const data = await api.get('/expeditions/stations/list');
      setStations(data.stations || []);
    } catch {}
  };

  useEffect(() => { loadItems(); loadStations(); }, []);

  const blankForm = {
    title: '', title_hi: '', summary: '', summary_hi: '', description: '', description_hi: '',
    region: 'ANTARCTIC', station_id: '', start_date: '', end_date: '', year: new Date().getFullYear(),
    expedition_status: 'PLANNED', objectives: '', objectives_hi: '',
  };

  const [form, setForm] = useState(blankForm);

  const handleNew = () => {
    setMessage({ type: 'error', text: 'Please use the New Entry section to add expeditions.' });
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || '', title_hi: item.title_hi || '', summary: item.summary || '',
      summary_hi: item.summary_hi || '', description: item.description || '', description_hi: item.description_hi || '',
      region: item.region || 'ANTARCTIC', station_id: item.station_id || '', start_date: item.start_date || '',
      end_date: item.end_date || '', year: item.year || '', expedition_status: item.expedition_status || 'PLANNED',
      objectives: item.objectives || '', objectives_hi: item.objectives_hi || '',
    });
    setShowForm(true);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/expeditions/${editItem.id}`, form);
      } else {
        await api.post('/expeditions', form);
      }
      const isEditor = user.role === 'EDITOR';
      setMessage({ type: 'success', text: isEditor ? 'Submitted for admin approval!' : (editItem ? 'Expedition updated!' : 'Expedition created!') });
      setShowForm(false);
      await loadItems();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setSaving(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/expeditions/${id}`, { status: newStatus });
      setMessage({ type: 'success', text: `Status changed to ${newStatus}` });
      await loadItems();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const statusColors = {
    DRAFT: 'bg-slate-500', IN_REVIEW: 'bg-aurora-500', APPROVED: 'bg-glacier-700',
    PUBLISHED: 'bg-glacier-500', ARCHIVED: 'bg-slate-800', PRIVATE: 'bg-slate-800'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-h1">Expedition Manager</h1>
          <p className="text-[14px] font-sans text-slate-500 mt-1">
            {user.role === 'EDITOR' ? 'Create and edit expeditions. Changes require admin approval.' : 'Manage all expeditions. You can create, edit, and change status directly.'}
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-3 py-2 rounded-card text-[13px] font-sans border ${message.type === 'success' ? 'bg-glacier-500/10 border-glacier-500 text-glacier-700' : 'bg-ember-500/10 border-ember-500 text-ember-500'}`}>
          {message.text}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-card border border-line p-5 w-full max-w-[700px] shadow-lg mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2">{editItem ? 'Edit Expedition' : 'New Expedition'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-800 text-[20px]">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" placeholder="e.g. 44th Indian Antarctic Expedition" />
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Title (Hindi)</label>
                  <input value={form.title_hi} onChange={e => setForm({...form, title_hi: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Region *</label>
                  <select value={form.region} onChange={e => setForm({...form, region: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans">
                    <option value="ANTARCTIC">Antarctic</option>
                    <option value="ARCTIC">Arctic</option>
                    <option value="SOUTHERN_OCEAN">Southern Ocean</option>
                    <option value="HIMALAYA">Himalaya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Station</label>
                  <select value={form.station_id} onChange={e => setForm({...form, station_id: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans">
                    <option value="">None</option>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Year</label>
                  <input type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Expedition Status</label>
                  <select value={form.expedition_status} onChange={e => setForm({...form, expedition_status: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans">
                    <option value="PLANNED">Planned</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-sans text-slate-800 mb-1">Summary</label>
                <textarea value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} rows={2}
                  className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
              </div>
              <div>
                <label className="block text-[13px] font-sans text-slate-800 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                  className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
              </div>
              <div>
                <label className="block text-[13px] font-sans text-slate-800 mb-1">Objectives</label>
                <textarea value={form.objectives} onChange={e => setForm({...form, objectives: e.target.value})} rows={2}
                  className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving}
                  className="bg-glacier-500 text-white font-sans text-[14px] px-5 py-2 rounded-card hover:bg-glacier-700 transition-colors duration-150 disabled:opacity-50">
                  {saving ? 'Saving...' : (user.role === 'EDITOR' ? 'Submit for Approval' : (editItem ? 'Update' : 'Create'))}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="bg-white text-slate-500 border border-line font-sans text-[14px] px-5 py-2 rounded-card hover:bg-frost-50 transition-colors duration-150">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items table */}
      {loading ? (
        <p className="font-sans text-slate-500">Loading...</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-card border border-line p-4">
          <p className="text-[14px] font-sans text-slate-500">No expeditions yet. Click "New Expedition" to create one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-card border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-frost-50 border-b border-line">
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Title</th>
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Region</th>
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Year</th>
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Status</th>
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Exp. Status</th>
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-line last:border-0 hover:bg-frost-50/50 transition-colors duration-100">
                    <td className="text-[13px] font-sans text-navy-900 py-2 px-3 font-bold max-w-[250px] truncate">{item.title}</td>
                    <td className="text-[13px] font-sans text-slate-500 py-2 px-3">{item.region?.replace('_', ' ')}</td>
                    <td className="text-[13px] font-sans text-slate-500 py-2 px-3">{item.year}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-sans text-white px-2 py-0.5 rounded-full ${statusColors[item.status] || 'bg-slate-500'}`}>
                        {item.status === 'ARCHIVED' ? 'PRIVATE' : item.status}
                      </span>
                    </td>
                    <td className="text-[13px] font-sans text-slate-500 py-2 px-3">{item.expedition_status}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(item)} className="text-[12px] font-sans text-glacier-500 hover:underline">Edit</button>
                        {user.role === 'ADMIN' && item.status === 'DRAFT' && (
                          <button onClick={() => handleStatusChange(item.id, 'PUBLISHED')} className="text-[12px] font-sans text-aurora-500 hover:underline ml-2">Publish</button>
                        )}
                        {user.role === 'ADMIN' && item.status === 'PUBLISHED' && (
                          <button onClick={() => handleStatusChange(item.id, 'ARCHIVED')} className="text-[12px] font-sans text-ember-500 hover:underline ml-2">Keep Private</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
