import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../../api/client';

export default function Dashboard() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, notifData] = await Promise.all([
          api.get('/stats/admin'),
          api.get('/notifications?unread_only=true'),
        ]);
        setStats(statsData);
        setNotifications(notifData.notifications || []);
      } catch (err) { console.error('Failed to load data', err); }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <p className="font-sans text-slate-500">Loading dashboard...</p>;

  const countByStatus = (statusArray, status) => {
    if (!statusArray) return 0;
    const item = statusArray.find(s => s.status === status);
    return item ? item.count : 0;
  };

  const totalByType = (statusArray) => {
    if (!statusArray) return 0;
    return statusArray.reduce((sum, s) => sum + s.count, 0);
  };

  const pubExpeditions = countByStatus(stats?.contentByStatus?.expeditions, 'PUBLISHED');
  const pubDatasets = countByStatus(stats?.contentByStatus?.datasets, 'PUBLISHED');
  const pubPublications = countByStatus(stats?.contentByStatus?.publications, 'PUBLISHED');
  const pubMedia = countByStatus(stats?.contentByStatus?.media, 'PUBLISHED');
  const pubNews = countByStatus(stats?.contentByStatus?.news, 'PUBLISHED');

  const totalExpeditions = totalByType(stats?.contentByStatus?.expeditions);
  const totalDatasets = totalByType(stats?.contentByStatus?.datasets);
  const totalPublications = totalByType(stats?.contentByStatus?.publications);
  const totalMedia = totalByType(stats?.contentByStatus?.media);

  // Status bar widths
  const statusBar = (statusArray) => {
    const total = totalByType(statusArray);
    if (!total) return [];
    const colors = { DRAFT: '#64748B', IN_REVIEW: '#00B4D8', APPROVED: '#1E3E62', PUBLISHED: '#3B82F6', ARCHIVED: '#94A3B8' };
    return (statusArray || []).map(s => ({
      status: s.status, count: s.count, pct: Math.round((s.count / total) * 100),
      color: colors[s.status] || '#94A3B8',
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-h1">Welcome, {user.name}</h1>
          <p className="text-[14px] font-sans text-slate-500">
            {user.role === 'ADMIN' ? 'You have full administrative access.' : 'You have editor access. Your content changes will require admin approval.'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-sans text-slate-400">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Notification alert */}
      {notifications.length > 0 && (
        <div className="mb-4 bg-glacier-500/10 border border-glacier-500 rounded-card p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[18px]">🔔</span>
            <p className="text-[13px] font-sans text-glacier-700 font-bold">
              You have {notifications.length} unread notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to={user.role === 'ADMIN' ? '/admin/approvals' : '/admin/my-submissions'}
            className="text-[12px] font-sans text-glacier-500 hover:underline">View →</Link>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Link to="/admin/approvals" className="bg-white p-3 rounded-card border border-line shadow-sm hover:shadow-hover hover:border-glacier-500 transition-all duration-150 group">
          <p className="text-[11px] font-sans text-slate-500 mb-1 uppercase tracking-wider font-bold">Pending</p>
          <p className="text-[28px] font-serif font-bold text-ember-500 group-hover:text-glacier-500 transition-colors">{stats?.totalPending || 0}</p>
          <p className="text-[10px] font-sans text-slate-400 mt-1">awaiting review</p>
        </Link>
        <Link to="/admin/expeditions" className="bg-white p-3 rounded-card border border-line shadow-sm hover:shadow-hover hover:border-glacier-500 transition-all duration-150 group">
          <p className="text-[11px] font-sans text-slate-500 mb-1 uppercase tracking-wider font-bold">Expeditions</p>
          <p className="text-[28px] font-serif font-bold text-navy-900">{pubExpeditions}</p>
          <p className="text-[10px] font-sans text-slate-400 mt-1">{totalExpeditions} total</p>
        </Link>
        <Link to="/admin/datasets" className="bg-white p-3 rounded-card border border-line shadow-sm hover:shadow-hover hover:border-glacier-500 transition-all duration-150 group">
          <p className="text-[11px] font-sans text-slate-500 mb-1 uppercase tracking-wider font-bold">Datasets</p>
          <p className="text-[28px] font-serif font-bold text-navy-900">{pubDatasets}</p>
          <p className="text-[10px] font-sans text-slate-400 mt-1">{totalDatasets} total</p>
        </Link>
        <Link to="/admin/publications" className="bg-white p-3 rounded-card border border-line shadow-sm hover:shadow-hover hover:border-glacier-500 transition-all duration-150 group">
          <p className="text-[11px] font-sans text-slate-500 mb-1 uppercase tracking-wider font-bold">Publications</p>
          <p className="text-[28px] font-serif font-bold text-navy-900">{pubPublications}</p>
          <p className="text-[10px] font-sans text-slate-400 mt-1">{totalPublications} total</p>
        </Link>
        <Link to="/admin/media" className="bg-white p-3 rounded-card border border-line shadow-sm hover:shadow-hover hover:border-glacier-500 transition-all duration-150 group">
          <p className="text-[11px] font-sans text-slate-500 mb-1 uppercase tracking-wider font-bold">Media</p>
          <p className="text-[28px] font-serif font-bold text-navy-900">{pubMedia}</p>
          <p className="text-[10px] font-sans text-slate-400 mt-1">{totalMedia} total</p>
        </Link>
        <Link to="/admin/news" className="bg-white p-3 rounded-card border border-line shadow-sm hover:shadow-hover hover:border-glacier-500 transition-all duration-150 group">
          <p className="text-[11px] font-sans text-slate-500 mb-1 uppercase tracking-wider font-bold">News</p>
          <p className="text-[28px] font-serif font-bold text-navy-900">{pubNews}</p>
          <p className="text-[10px] font-sans text-slate-400 mt-1">published articles</p>
        </Link>
      </div>

      {/* Content Status Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Expeditions', data: stats?.contentByStatus?.expeditions },
          { label: 'Datasets', data: stats?.contentByStatus?.datasets },
          { label: 'Publications', data: stats?.contentByStatus?.publications },
          { label: 'Media', data: stats?.contentByStatus?.media },
        ].map(({ label, data }) => {
          const bars = statusBar(data);
          const total = totalByType(data);
          return (
            <div key={label} className="bg-white rounded-card border border-line p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-sans font-bold text-navy-900">{label}</h3>
                <span className="text-[11px] font-sans text-slate-400">{total} total</span>
              </div>
              {total > 0 ? (
                <>
                  <div className="flex rounded-full overflow-hidden h-2 mb-2">
                    {bars.map(b => (
                      <div key={b.status} style={{ width: `${b.pct}%`, backgroundColor: b.color, minWidth: b.count > 0 ? '4px' : 0 }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {bars.map(b => (
                      <span key={b.status} className="text-[10px] font-sans text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                        {b.status} ({b.count})
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[12px] font-sans text-slate-400">No content yet</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Audit Log */}
        <div className="lg:col-span-2 bg-white rounded-card border border-line p-4 shadow-sm">
          <h2 className="text-h3 mb-3">Recent Activity</h2>
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {stats?.recentAudit?.map(log => (
              <div key={log.id} className="pb-2 border-b border-line last:border-0 last:pb-0 flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-glacier-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px]">📝</span>
                </div>
                <div>
                  <p className="text-[13px] font-sans text-slate-800">
                    <span className="font-bold text-navy-900">{log.user_name || 'System'}</span>{' '}
                    {log.action?.toLowerCase()}d a {log.entity_type}
                  </p>
                  <p className="text-[10px] font-sans text-slate-400 mt-0.5">{log.created_at}</p>
                </div>
              </div>
            ))}
            {(!stats?.recentAudit || stats.recentAudit.length === 0) && (
              <p className="text-[13px] font-sans text-slate-500">No recent activity.</p>
            )}
          </div>
        </div>

        {/* System Info Panel */}
        <div className="bg-white rounded-card border border-line p-4 shadow-sm">
          <h2 className="text-h3 mb-3">System Info</h2>
          {user.role === 'ADMIN' && (
            <div className="mb-4">
              <h3 className="text-[13px] font-sans font-bold text-slate-800 mb-2">Users by Role</h3>
              <div className="space-y-1.5">
                {stats?.usersByRole?.map(r => (
                  <div key={r.role} className="flex justify-between items-center text-[13px] font-sans">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${r.role === 'ADMIN' ? 'bg-navy-900' : r.role === 'EDITOR' ? 'bg-glacier-700' : 'bg-slate-500'}`} />
                      {r.role}
                    </span>
                    <span className="font-mono bg-frost-50 px-2 py-0.5 rounded border border-line text-[12px]">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.expeditionsByRegion && stats.expeditionsByRegion.length > 0 && (
            <div className="mb-4">
              <h3 className="text-[13px] font-sans font-bold text-slate-800 mb-2">Expeditions by Region</h3>
              <div className="space-y-1.5">
                {stats.expeditionsByRegion.map(r => (
                  <div key={r.region} className="flex justify-between items-center text-[12px] font-sans">
                    <span className="text-slate-600">{r.region?.replace('_', ' ')}</span>
                    <span className="font-mono text-navy-900 font-bold">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-line">
            <h3 className="text-[13px] font-sans font-bold text-slate-800 mb-1">Downloads</h3>
            <p className="text-[12px] font-sans text-slate-600">
              Total dataset downloads: <span className="font-bold text-navy-900">{stats?.totalDownloads || 0}</span>
            </p>
          </div>

          {/* Quick actions */}
          <div className="mt-4 pt-3 border-t border-line">
            <h3 className="text-[13px] font-sans font-bold text-slate-800 mb-2">Quick Actions</h3>
            <div className="space-y-1">
              <Link to="/admin/expeditions" className="block text-[12px] font-sans text-glacier-500 hover:text-glacier-700 hover:underline transition-colors">+ New Expedition</Link>
              <Link to="/admin/datasets" className="block text-[12px] font-sans text-glacier-500 hover:text-glacier-700 hover:underline transition-colors">+ New Dataset</Link>
              <Link to="/admin/publications" className="block text-[12px] font-sans text-glacier-500 hover:text-glacier-700 hover:underline transition-colors">+ New Publication</Link>
              <Link to="/admin/news" className="block text-[12px] font-sans text-glacier-500 hover:text-glacier-700 hover:underline transition-colors">+ New Article</Link>
              <Link to="/admin/studio" className="block text-[12px] font-sans text-glacier-500 hover:text-glacier-700 hover:underline transition-colors">→ Content Studio</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
