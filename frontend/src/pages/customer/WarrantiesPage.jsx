import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Calendar, Store, ArrowRight, Layers } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWarranties() {
      try {
        const data = await api.get('/warranties');
        setWarranties(data);
      } catch (err) {
        console.error('Failed to load warranties:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWarranties();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Retrieving verified warranty records..." fullPage />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Service Warranties
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review authentic warranty certificates issued by participating repair providers upon collection
        </p>
      </div>

      {warranties.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No warranties issued yet"
          description="When your repair work is completed and collected, the workshop issues a verifiable warranty here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warranties.map((w) => (
            <div
              key={w.id}
              className={`rounded-3xl p-6 border shadow-sm space-y-4 transition-all ${
                w.is_active
                  ? 'bg-white border-emerald-200 ring-1 ring-emerald-500/10'
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${w.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-400">{w.warranty_number}</span>
                    <h3 className="font-bold text-slate-900 text-base">{w.business_name}</h3>
                  </div>
                </div>
                <StatusBadge status={w.is_active ? 'active' : 'expired'} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Duration:</span>
                  <div className="font-bold text-slate-800">{w.duration_days} Days</div>
                </div>
                <div>
                  <span className="text-slate-400">Valid Until:</span>
                  <div className="font-bold text-slate-800">
                    {new Date(w.end_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-600">Covered Terms:</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {w.covered_terms}
                </p>
              </div>

              {w.limitations && (
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-500">Exclusions:</span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    {w.limitations}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  to={`/customer/jobs/${w.job_id}`}
                  className="text-brand-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  View Original Repair Job <ArrowRight size={12} />
                </Link>
                <Link
                  to={`/customer/passports/${w.asset_id}`}
                  className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <Layers size={12} /> Asset Passport
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
