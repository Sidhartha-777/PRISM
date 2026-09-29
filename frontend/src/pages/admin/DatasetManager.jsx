import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client';

export default function DatasetManager() {
  const { user } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [expeditions, setExpeditions] = useState([]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.get('/datasets/admin/all');
      setItems(data.datasets || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  const loadExpeditions = async () => {
    try {
      const data = await api.get('/expeditions/admin/all');
      setExpeditions(data.expeditions || []);
    } catch {}
  };

  useEffect(() => { loadItems(); loadExpeditions(); }, []);

  const blankForm = {
    title: '', title_hi: '', description: '', description_hi: '', discipline: 'Glaciology',
    parameters: '', spatial_coverage: '', temporal_coverage_start: '', temporal_coverage_end: '',
    format: 'CSV', file_size: '', licence: 'CC-BY-4.0', doi: '', citation: '', version: '1.0',
    access_level: 'PUBLIC', contact_name: '', contact_email: '', expedition_id: '',
  };

  const [form, setForm] = useState(blankForm);

  const handleNew = () => {
    setMessage({ type: 'error', text: 'Please use the New Entry section to add datasets.' });
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || '', title_hi: item.title_hi || '', description: item.description || '',
      description_hi: item.description_hi || '', discipline: item.discipline || 'Glaciology',
      parameters: item.parameters || '', spatial_coverage: item.spatial_coverage || '',
      temporal_coverage_start: item.temporal_coverage_start || '', temporal_coverage_end: item.temporal_coverage_end || '',
      format: item.format || 'CSV', file_size: item.file_size || '', licence: item.licence || 'CC-BY-4.0',
      doi: item.doi || '', citation: item.citation || '', version: item.version || '1.0',
      access_level: item.access_level || 'PUBLIC', contact_name: item.contact_name || '',
      contact_email: item.contact_email || '', expedition_id: item.expedition_id || '',
    });
    setShowForm(true);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/datasets/${editItem.id}`, form);
      } else {
        await api.post('/datasets', form);
      }
      const isEditor = user.role === 'EDITOR';
      setMessage({ type: 'success', text: isEditor ? 'Submitted for admin approval!' : (editItem ? 'Dataset updated!' : 'Dataset created!') });
      setShowForm(false);
      await loadItems();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setSaving(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/datasets/${id}`, { status: newStatus });
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

  const disciplines = ['Glaciology', 'Meteorology', 'Oceanography', 'Biology', 'Geology', 'Atmospheric Science', 'Ice Core Studies', 'Seismology'];
  const formats = ['CSV', 'NetCDF', 'GeoJSON', 'HDF5', 'XLSX', 'JSON', 'GeoTIFF', 'Shapefile'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-h1">Dataset Manager</h1>
          <p className="text-[14px] font-sans text-slate-500 mt-1">
            {user.role === 'EDITOR' ? 'Create and edit datasets. Changes require admin approval.' : 'Manage the data repository. Create, edit, and publish datasets.'}
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-3 py-2 rounded-card text-[13px] font-sans border ${message.type === 'success' ? 'bg-glacier-500/10 border-glacier-500 text-glacier-700' : 'bg-ember-500/10 border-ember-500 text-ember-500'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-card border border-line p-5 w-full max-w-[700px] shadow-lg mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2">{editItem ? 'Edit Dataset' : 'New Dataset'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-800 text-[20px]">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" placeholder="e.g. Arctic Sea Ice Extent 2024" />
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Title (Hindi)</label>
                  <input value={form.title_hi} onChange={e => setForm({...form, title_hi: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Discipline</label>
                  <select value={form.discipline} onChange={e => setForm({...form, discipline: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans">
                    {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Format</label>
                  <select value={form.format} onChange={e => setForm({...form, format: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans">
                    {formats.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Access Level</label>
                  <select value={form.access_level} onChange={e => setForm({...form, access_level: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans">
                    <option value="PUBLIC">Public</option>
                    <option value="REGISTERED">Registered</option>
                    <option value="RESTRICTED">Restricted</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-sans text-slate-800 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                  className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Parameters</label>
                  <input value={form.parameters} onChange={e => setForm({...form, parameters: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" placeholder="e.g. Temperature, Pressure" />
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Spatial Coverage</label>
                  <input value={form.spatial_coverage} onChange={e => setForm({...form, spatial_coverage: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" placeholder="e.g. 60°S - 90°S" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Temporal Start</label>
                  <input type="date" value={form.temporal_coverage_start} onChange={e => setForm({...form, temporal_coverage_start: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Temporal End</label>
                  <input type="date" value={form.temporal_coverage_end} onChange={e => setForm({...form, temporal_coverage_end: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Version</label>
                  <input value={form.version} onChange={e => setForm({...form, version: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">DOI</label>
                  <input value={form.doi} onChange={e => setForm({...form, doi: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" placeholder="10.xxxx/..." />
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Licence</label>
                  <input value={form.licence} onChange={e => setForm({...form, licence: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Contact Name</label>
                  <input value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
                <div>
                  <label className="block text-[13px] font-sans text-slate-800 mb-1">Contact Email</label>
                  <input type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})}
                    className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-sans text-slate-800 mb-1">Linked Expedition</label>
                <select value={form.expedition_id} onChange={e => setForm({...form, expedition_id: e.target.value})}
                  className="w-full border border-line rounded-input px-3 py-2 text-[14px] font-sans">
                  <option value="">None</option>
                  {expeditions.map(exp => <option key={exp.id} value={exp.id}>{exp.title}</option>)}
                </select>
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

      {loading ? (
        <p className="font-sans text-slate-500">Loading...</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-card border border-line p-4">
          <p className="text-[14px] font-sans text-slate-500">No datasets yet. Click "New Dataset" to create one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-card border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-frost-50 border-b border-line">
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Title</th>
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Discipline</th>
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Format</th>
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Access</th>
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Status</th>
                  <th className="text-[12px] font-sans text-slate-500 py-2 px-3 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-line last:border-0 hover:bg-frost-50/50 transition-colors duration-100">
                    <td className="text-[13px] font-sans text-navy-900 py-2 px-3 font-bold max-w-[250px] truncate">{item.title}</td>
                    <td className="text-[13px] font-sans text-slate-500 py-2 px-3">{item.discipline}</td>
                    <td className="text-[12px] font-mono text-slate-500 py-2 px-3">{item.format}</td>
                    <td className="text-[13px] font-sans text-slate-500 py-2 px-3">{item.access_level}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-sans text-white px-2 py-0.5 rounded-full ${statusColors[item.status] || 'bg-slate-500'}`}>
                        {item.status === 'ARCHIVED' ? 'PRIVATE' : item.status}
                      </span>
                    </td>
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
