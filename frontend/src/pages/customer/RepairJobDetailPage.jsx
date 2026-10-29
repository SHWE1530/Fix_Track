import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Wrench,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Upload,
  Layers,
  Check,
  RotateCcw
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import CategoryIcon from '../../components/CategoryIcon';
import Timeline from '../../components/Timeline';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RepairJobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null); // 'approve', 'reject', 'request_changes'
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [error, setError] = useState('');

  const loadJobData = async () => {
    try {
      const [jobData, estData] = await Promise.all([
        api.get(`/repair-jobs/${jobId}`),
        api.get(`/estimates/jobs/${jobId}`),
      ]);
      setJob(jobData);
      setEstimates(estData);
    } catch (err) {
      console.error('Failed to load repair job detail:', err);
      setError(err.message || 'Failed to load repair details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  const handleEstimateDecision = async () => {
    if (!job?.latest_estimate) return;
    setSubmittingDecision(true);
    try {
      await api.post(`/estimates/${job.latest_estimate.id}/decide`, {
        decision: actionModal,
        notes: decisionNotes.trim() || null,
      });
      setActionModal(null);
      setDecisionNotes('');
      await loadJobData();
    } catch (err) {
      alert(err.message || 'Failed to submit decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving verified job history & records..." fullPage />;
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle size={36} className="mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900">Repair Job Not Found</h2>
        <p className="text-xs text-slate-500">The requested job does not exist or you lack authorization to inspect it.</p>
        <Link to="/customer/jobs" className="text-xs font-semibold text-brand-600 hover:underline">
          Return to My Repairs
        </Link>
      </div>
    );
  }

  const latestEstimate = job.latest_estimate;
  const isAwaitingApproval = job.status === 'AWAITING_APPROVAL' && latestEstimate?.status === 'submitted';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Bar */}
      <div>
        <Link
          to="/customer/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-slate-400">{job.job_number}</span>
              <StatusBadge status={job.status} />
              {job.repeat_fault_job_number && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                  Repeat Fault of {job.repeat_fault_job_number}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.asset_summary?.make} {job.asset_summary?.model}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Repairing Workshop:{' '}
              <span className="font-semibold text-slate-800">
                {job.business_summary?.name}
              </span>{' '}
              &bull; Opened on {new Date(job.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/customer/passports/${job.asset_id}`}
              className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Layers size={14} /> View Asset Passport
            </Link>
          </div>
        </div>
      </div>

      {/* Main Repair Workflow Timeline */}
      <Timeline currentStatus={job.status} events={job.events} />

      {/* Itemized Estimate Card */}
      {latestEstimate && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">Itemized Estimate</h3>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                  v{latestEstimate.version}
                </span>
                <StatusBadge status={latestEstimate.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Prepared by shop technician &bull; Minor currency units strictly guaranteed
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">
                ${(latestEstimate.total_minor / 100).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">{latestEstimate.currency} Total (incl. tax)</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Item Description</th>
                  <th className="pb-3 text-center">Type</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Unit Price</th>
                  <th className="pb-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {latestEstimate.line_items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-800">{item.description}</td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] capitalize">
                        {item.item_type}
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3 text-right font-mono text-slate-600">
                      ${(item.unit_price_minor / 100).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      ${(item.total_minor / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown */}
          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-xs text-slate-500 max-w-md">
              {latestEstimate.notes && (
                <p className="italic">
                  <span className="font-semibold text-slate-700 not-italic">Notes: </span>
                  {latestEstimate.notes}
                </p>
              )}
            </div>

            <div className="space-y-1 text-xs w-full sm:w-64 text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">${(latestEstimate.subtotal_minor / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimated Tax:</span>
                <span className="font-mono font-semibold">${(latestEstimate.tax_minor / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                <span>Total:</span>
                <span className="font-mono">${(latestEstimate.total_minor / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Decision Actions (Only when AWAITING_APPROVAL) */}
          {isAwaitingApproval && (
            <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                <Clock size={16} className="text-teal-700" />
                Customer Approval Gate: Please review the itemized cost breakdown above
              </div>
              <p className="text-xs text-teal-800 leading-relaxed">
                Work will not proceed until you authorize this estimate. If you would like the technician to adjust parts or clarify labor, you can request changes.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActionModal('approve')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 size={16} /> Approve & Authorize Repair
                </button>

                <button
                  onClick={() => setActionModal('request_changes')}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw size={14} /> Request Estimate Revision
                </button>

                <button
                  onClick={() => setActionModal('reject')}
                  className="px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <XCircle size={14} /> Reject Estimate
                </button>
              </div>
            </div>
          )}

          {/* Past Estimate Versions History */}
          {estimates.length > 1 && (
            <div className="pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Estimate Version Audit History:
              </div>
              <div className="space-y-1.5">
                {estimates.map((est) => (
                  <div key={est.id} className="text-xs flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700">v{est.version}</span>
                      <StatusBadge status={est.status} size="sm" />
                      <span className="text-slate-500 font-mono">${(est.total_minor / 100).toFixed(2)}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(est.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Intake & Technical Diagnosis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Intake Inspection */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText size={16} className="text-brand-600" /> Intake Condition & Accessories
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-semibold text-slate-500">Documented Physical Condition:</span>
              <p className="text-slate-800 mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {job.physical_condition || 'Awaiting shop check-in inspection.'}
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Included Accessories:</span>
              <p className="text-slate-800 mt-0.5 font-medium">
                {job.accessories_included || 'None logged.'}
              </p>
            </div>
          </div>
        </div>

        {/* Technical Diagnosis */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Wrench size={16} className="text-purple-600" /> Technician Diagnostic Findings
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-semibold text-slate-500">Diagnosis Summary:</span>
              <p className="text-slate-800 mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {job.diagnosis_summary || 'Diagnostic inspection underway by technician.'}
              </p>
            </div>
            {job.technical_findings && (
              <div>
                <span className="font-semibold text-slate-500">Technical Findings:</span>
                <p className="text-slate-800 mt-0.5">
                  {job.technical_findings}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Work Performed & Replaced Parts (When completed / in progress) */}
      {job.work_performed && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" /> Service Execution & Parts Replaced
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-500">Work Performed:</span>
              <p className="text-slate-800 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {job.work_performed}
              </p>
            </div>
            {job.parts_replaced?.length > 0 && (
              <div>
                <span className="font-semibold text-slate-500">Replaced Components:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {job.parts_replaced.map((part, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 font-medium">
                      {part}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Warranty Certificate Card */}
      {job.active_warranty && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-teal-500/5 p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-700" />
              <h3 className="font-extrabold text-slate-900 text-base">Verified Repair Warranty</h3>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-800">
              {job.active_warranty.warranty_number}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100">
            <div>
              <span className="text-slate-400">Duration:</span>
              <div className="font-bold text-slate-800">{job.active_warranty.duration_days} Days</div>
            </div>
            <div>
              <span className="text-slate-400">Effective Until:</span>
              <div className="font-bold text-slate-800">
                {new Date(job.active_warranty.end_date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Status:</span>
              <div className="font-bold text-emerald-700">Active & Verifiable</div>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <span className="font-semibold text-slate-700">Covered Terms:</span>
            <p className="text-slate-600 leading-relaxed">{job.active_warranty.covered_terms}</p>
          </div>
          {job.active_warranty.limitations && (
            <div className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Exclusions:</span>
              <p className="text-slate-500 leading-relaxed">{job.active_warranty.limitations}</p>
            </div>
          )}
        </div>
      )}

      {/* Estimate Decision Modal */}
      <Modal
        isOpen={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        title={
          actionModal === 'approve'
            ? 'Authorize & Approve Repair Estimate'
            : actionModal === 'request_changes'
            ? 'Request Estimate Revision'
            : 'Reject Repair Estimate'
        }
      >
        <div className="space-y-4 text-xs">
          {actionModal === 'approve' ? (
            <p className="text-slate-600 leading-relaxed">
              By authorizing this estimate of{' '}
              <strong className="text-slate-900 font-mono">
                ${(latestEstimate?.total_minor / 100).toFixed(2)}
              </strong>
              , you instruct the workshop to proceed with parts ordering and service execution. This agreement will be stamped into your permanent service history.
            </p>
          ) : actionModal === 'request_changes' ? (
            <p className="text-slate-600 leading-relaxed">
              Describe what parts or labor adjustments you would like the technician to revise. A new estimate version (v{(latestEstimate?.version || 1) + 1}) will be issued.
            </p>
          ) : (
            <p className="text-slate-600 leading-relaxed">
              Rejecting this estimate will return the job for diagnostic conclusion or return of the item.
            </p>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              {actionModal === 'approve' ? 'Optional Notes for Shop' : 'Reason / Notes *'}
            </label>
            <textarea
              rows={3}
              required={actionModal !== 'approve'}
              placeholder="Enter your comments or instructions..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setActionModal(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEstimateDecision}
              disabled={submittingDecision || (actionModal !== 'approve' && !decisionNotes.trim())}
              className={`px-5 py-2 font-bold text-white rounded-xl shadow-sm transition-all disabled:opacity-50 ${
                actionModal === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : actionModal === 'request_changes'
                  ? 'bg-brand-600 hover:bg-brand-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submittingDecision ? 'Submitting...' : 'Confirm Decision'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
