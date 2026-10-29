import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Shield, Store, Layers, XCircle, CheckCircle2, Clock } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function SharingGrantsPage() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  const loadGrants = async () => {
    try {
      const data = await api.get('/sharing-grants/my-grants');
      setGrants(data);
    } catch (err) {
      console.error('Failed to load sharing grants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrants();
  }, []);

  const handleRevoke = async (grantId) => {
    if (!window.confirm('Are you sure you want to revoke this shop’s access to your Repair Passport? Access will terminate immediately.')) {
      return;
    }
    setRevokingId(grantId);
    try {
      await api.post(`/sharing-grants/${grantId}/revoke`);
      await loadGrants();
    } catch (err) {
      alert(err.message || 'Failed to revoke access');
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Checking active access permissions..." fullPage />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Repair Passport Sharing Permissions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review and revoke active service history sharing grants you have given to independent repair providers
        </p>
      </div>

      {grants.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No sharing permissions granted"
          description="When you grant a workshop access to inspect your Repair Passport, your active permissions will appear here."
          actionLabel="View My Assets"
          actionLink="/customer/assets"
        />
      ) : (
        <div className="space-y-4">
          {grants.map((grant) => (
            <div
              key={grant.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
                  <Store size={22} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {grant.target_business_name}
                    </h3>
                    <StatusBadge status={grant.is_valid ? 'active' : grant.status} />
                  </div>
                  <div className="text-xs text-slate-600">
                    Shared Asset:{' '}
                    <strong className="text-slate-800">
                      {grant.asset_summary?.make} {grant.asset_summary?.model}
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>Expires: {new Date(grant.expires_at).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span>Granted: {new Date(grant.created_at).toLocaleDateString()}</span>
                  </div>
                  {grant.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-1">"{grant.notes}"</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <Link
                  to={`/customer/passports/${grant.asset_id}`}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  View Passport
                </Link>

                {grant.is_valid && (
                  <button
                    onClick={() => handleRevoke(grant.id)}
                    disabled={revokingId === grant.id}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle size={14} /> {revokingId === grant.id ? 'Revoking...' : 'Revoke Access'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
