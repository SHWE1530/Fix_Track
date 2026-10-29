import React, { useState, useEffect } from 'react';
import { Shield, Users, Store, FileText, CheckCircle2, XCircle, Search, AlertCircle, Lock } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('businesses'); // 'businesses', 'users', 'audit'
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bizData, usersData, auditData] = await Promise.all([
        api.get('/admin/businesses'),
        api.get('/admin/users'),
        api.get('/admin/audit-logs'),
      ]);
      setBusinesses(bizData);
      setUsers(usersData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleVerify = async (businessId, currentVerified) => {
    try {
      await api.put(`/admin/businesses/${businessId}/verify`, {
        is_verified: !currentVerified,
        notes: !currentVerified ? 'Verified business credentials and insurance' : 'Verification revoked',
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleToggleUserStatus = async (userId, currentActive) => {
    const reason = window.prompt(`Enter reason for ${currentActive ? 'suspending' : 'restoring'} account:`, 'Administrative compliance audit');
    if (reason === null) return;

    try {
      await api.put(`/admin/users/${userId}/status`, {
        is_active: !currentActive,
        reason,
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading administration console & audit trail..." fullPage />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
              <Shield size={12} /> Platform Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administration & Verification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify repair shops, manage account moderation, and inspect system-wide audit trails
          </p>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-purple-900 text-xs flex items-start gap-3 shadow-sm">
        <Lock size={18} className="text-purple-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Customer Privacy Standard:</span>
          <p className="text-purple-800 text-[11px] leading-relaxed mt-0.5">
            Per platform specification, platform administrators do not receive unrestricted access to private customer documents. Access requires explicit customer sharing grants or active dispute authorization.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('businesses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'businesses'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store size={14} /> Business Verifications ({businesses.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={14} /> User Accounts ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText size={14} /> Platform Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab: Business Verifications */}
      {activeTab === 'businesses' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Workshop</th>
                  <th className="pb-3">Address & Phone</th>
                  <th className="pb-3">Categories</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {businesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-slate-50/50">
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{biz.name}</div>
                      <div className="text-[10px] text-slate-400">{biz.email}</div>
                    </td>
                    <td className="py-3 text-slate-600">
                      <div>{biz.address}</div>
                      <div className="text-[10px] text-slate-400">{biz.phone}</div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {biz.supported_categories.map((c) => (
                          <span key={c} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      {biz.is_verified ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                          Pending Audit
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleToggleVerify(biz.id, biz.is_verified)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors ${
                          biz.is_verified
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {biz.is_verified ? 'Revoke Verification' : 'Verify Workshop'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Registered</th>
                  <th className="pb-3">Account Status</th>
                  <th className="pb-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 font-semibold text-slate-700 capitalize">
                      {u.role.replace('_', ' ')}
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors ${
                            u.is_active
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {u.is_active ? 'Suspend Account' : 'Restore Account'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Platform Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {log.user_email || 'System'}
                    </span>
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-slate-600 font-mono">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
