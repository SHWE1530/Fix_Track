import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Layers,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Calendar,
  Store,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  ExternalLink,
  Lock,
  Clock,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import CategoryIcon from '../../components/CategoryIcon';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RepairPassportPage() {
  const { assetId } = useParams();
  const [passport, setPassport] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [targetBusinessId, setTargetBusinessId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [shareNotes, setShareNotes] = useState('');
  const [sharingSuccess, setSharingSuccess] = useState(null);
  const [sharingLoading, setSharingLoading] = useState(false);

  const loadPassport = async () => {
    try {
      const [passportData, bizData] = await Promise.all([
        api.get(`/passports/assets/${assetId}`),
        api.get('/businesses/directory'),
      ]);
      setPassport(passportData);
      setBusinesses(bizData);
      if (bizData.length > 0) {
        setTargetBusinessId(bizData[0].id);
      }
    } catch (err) {
      console.error('Failed to load repair passport:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassport();
  }, [assetId]);

  const handleCreateShareGrant = async (e) => {
    e.preventDefault();
    setSharingLoading(true);
    try {
      const grant = await api.post('/sharing-grants', {
        asset_id: assetId,
        target_business_id: targetBusinessId,
        expires_in_days: parseInt(expiresInDays, 10),
        notes: shareNotes.trim() || null,
      });
      setSharingSuccess(grant);
      setShareNotes('');
    } catch (err) {
      alert(err.message || 'Failed to create sharing grant');
    } finally {
      setSharingLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Compiling authenticated service records..." fullPage />;
  }

  if (!passport) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <AlertCircle size={36} className="mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900">Repair Passport Unavailable</h2>
        <p className="text-xs text-slate-500">Access to this passport has not been granted by the item owner.</p>
        <Link to="/customer/assets" className="text-xs font-semibold text-brand-600 hover:underline">
          Return to My Assets
        </Link>
      </div>
    );
  }

  const asset = passport.asset;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/customer/assets"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={14} /> Back to My Assets
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} /> Official Repair Passport
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Owner: {passport.owner_name}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setSharingSuccess(null);
            setShareModalOpen(true);
          }}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5"
        >
          <Share2 size={14} /> Grant Shop Access
        </button>
      </div>

      {/* Official Passport Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} /> Verified Cross-Service Ledger
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {asset.make} {asset.model}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                SN: {asset.serial_number || 'N/A'}
              </span>
              <span>Category: <strong className="capitalize">{asset.category.replace('_', ' ')}</strong></span>
              {asset.year && <span>Year: <strong>{asset.year}</strong></span>}
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
            <div className="text-right">
              <div className="text-3xl font-black text-teal-400 font-mono">
                {passport.total_service_records}
              </div>
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Certified Service Records
              </div>
            </div>

            {passport.active_warranty && (
              <span className="mt-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck size={14} /> Under Warranty
              </span>
            )}
          </div>
        </div>

        {/* Decorative background badge */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 text-slate-800/20 pointer-events-none -z-0">
          <Layers size={220} />
        </div>
      </div>

      {/* Chronological Service Records Ledger */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock size={16} className="text-brand-600" /> Authorized Chronological Service Ledger
        </h2>

        {passport.records.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200 text-slate-500 text-xs">
            No service records have been generated for this asset yet. Once a repair job completes, its authenticated work and parts history will be preserved here.
          </div>
        ) : (
          <div className="space-y-6">
            {passport.records.map((rec, idx) => (
              <div
                key={rec.job_id || idx}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5 hover:border-brand-500/40 transition-colors"
              >
                {/* Record Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Store size={20} />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{rec.business_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Ref: {rec.job_number} &bull; Service Date: {new Date(rec.service_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rec.repeat_fault_of_job_number && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                        Repeat Fault of {rec.repeat_fault_of_job_number}
                      </span>
                    )}
                    <StatusBadge status={rec.status} />
                  </div>
                </div>

                {/* Issue and Work Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Reported Issue</span>
                    <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {rec.reported_issue}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Diagnosis Summary</span>
                    <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {rec.diagnosis_summary || 'Standard service inspection completed.'}
                    </p>
                  </div>
                </div>

                {/* Work Executed & Parts */}
                {rec.work_performed && (
                  <div className="space-y-2 text-xs">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Certified Work Performed</span>
                    <p className="text-slate-800 leading-relaxed bg-teal-50/40 p-3.5 rounded-xl border border-teal-100">
                      {rec.work_performed}
                    </p>
                  </div>
                )}

                {rec.parts_replaced?.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Installed Parts</span>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.parts_replaced.map((part, pIdx) => (
                        <span key={pIdx} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Summary & Warranty Footnote */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-4">
                    {rec.approved_estimate_summary && (
                      <span className="font-semibold text-slate-700">
                        Authorized Estimate: ${ (rec.approved_estimate_summary.total_minor / 100).toFixed(2) } ({rec.approved_estimate_summary.currency})
                      </span>
                    )}
                    {rec.warranty && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck size={14} /> {rec.warranty.duration_days}-Day Warranty ({rec.warranty.warranty_number})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Private internal notes excluded per platform privacy rules
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grant Shop Access Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Grant Temporary Shop Access to Repair Passport"
      >
        {sharingSuccess ? (
          <div className="space-y-4 text-xs text-center py-4">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Sharing Grant Activated</h4>
            <p className="text-slate-600 leading-relaxed max-w-sm mx-auto">
              Access to this Repair Passport has been granted to{' '}
              <strong>{sharingSuccess.target_business_name}</strong> until{' '}
              <strong>{new Date(sharingSuccess.expires_at).toLocaleDateString()}</strong>.
            </p>
            <p className="text-slate-400 text-[11px]">
              You can revoke this grant at any moment from your Sharing Grants tab.
            </p>
            <button
              onClick={() => setShareModalOpen(false)}
              className="px-6 py-2 bg-brand-600 text-white font-bold rounded-xl"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateShareGrant} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Select a participating repair business to temporarily share this device's verified service records. The recipient shop will only see authorized repairs and warranties (private personal notes remain protected).
            </p>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Recipient Repair Business *</label>
              <select
                value={targetBusinessId}
                onChange={(e) => setTargetBusinessId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} &bull; {b.address}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Grant Duration</label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value={7}>7 Days (Recommended for single inspection)</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
                <option value={180}>180 Days (Extended evaluation)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Optional Customer Notes for Recipient</label>
              <input
                type="text"
                placeholder="e.g. Please check previous OLED replacement records"
                value={shareNotes}
                onChange={(e) => setShareNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              >
              </input>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sharingLoading}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {sharingLoading ? 'Granting...' : 'Grant Access'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
