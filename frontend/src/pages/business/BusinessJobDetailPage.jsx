import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Wrench,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Plus,
  Trash2,
  ShieldCheck,
  FileText,
  User,
  Phone,
  Check
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function BusinessJobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'intake', 'diagnosis', 'estimate', 'complete_work', 'handover', 'hold'

  // Intake Form State
  const [physicalCondition, setPhysicalCondition] = useState('');
  const [accessories, setAccessories] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');

  // Diagnosis Form State
  const [diagSummary, setDiagSummary] = useState('');
  const [diagFindings, setDiagFindings] = useState('');
  const [diagFee, setDiagFee] = useState('0');

  // Estimate Form State
  const [lineItems, setLineItems] = useState([
    { description: 'Replacement Component', quantity: 1, unit_price_dollars: '89.00', item_type: 'parts' },
    { description: 'Diagnostic & Workshop Labor', quantity: 1, unit_price_dollars: '45.00', item_type: 'labor' }
  ]);
  const [taxRate, setTaxRate] = useState('8.0');
  const [estNotes, setEstNotes] = useState('Includes guaranteed parts and workmanship coverage.');
  const [estExpiresDays, setEstExpiresDays] = useState('14');

  // Work Completion State
  const [workPerformed, setWorkPerformed] = useState('');
  const [partsReplacedInput, setPartsReplacedInput] = useState('');

  // Handover & Warranty State
  const [collectorName, setCollectorName] = useState('');
  const [warrantyDays, setWarrantyDays] = useState('90');
  const [warrantyTerms, setWarrantyTerms] = useState('Full coverage for defects on replaced parts and workmanship.');
  const [warrantyExclusions, setWarrantyExclusions] = useState('Excludes accidental impact, liquid ingress, and third-party tampering.');

  // Hold / Cancel State
  const [statusReason, setStatusReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadJobData = async () => {
    try {
      const [jobData, estData] = await Promise.all([
        api.get(`/repair-jobs/${jobId}`),
        api.get(`/estimates/jobs/${jobId}`),
      ]);
      setJob(jobData);
      setEstimates(estData);

      // Prepopulate fields if existing
      if (jobData.physical_condition) setPhysicalCondition(jobData.physical_condition);
      if (jobData.accessories_included) setAccessories(jobData.accessories_included);
      if (jobData.diagnosis_summary) setDiagSummary(jobData.diagnosis_summary);
      if (jobData.technical_findings) setDiagFindings(jobData.technical_findings);
      if (jobData.customer_summary?.full_name) setCollectorName(jobData.customer_summary.full_name);
    } catch (err) {
      console.error('Failed to load business job details:', err);
      setError(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  // Handlers for workshop actions
  const handleSaveIntake = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/repair-jobs/${jobId}/intake`, {
        physical_condition: physicalCondition,
        accessories_included: accessories,
        intake_notes: intakeNotes,
      });
      setActiveModal(null);
      await loadJobData();
    } catch (err) {
      alert(err.message || 'Failed to record intake');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDiagnosis = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/repair-jobs/${jobId}/diagnosis`, {
        diagnosis_summary: diagSummary,
        technical_findings: diagFindings,
        diagnostic_fee_minor: Math.round(parseFloat(diagFee || '0') * 100),
      });
      setActiveModal(null);
      await loadJobData();
    } catch (err) {
      alert(err.message || 'Failed to record diagnosis');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEstimate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formattedItems = lineItems.map((item) => ({
        description: item.description.trim(),
        quantity: parseInt(item.quantity, 10) || 1,
        unit_price_minor: Math.round(parseFloat(item.unit_price_dollars || '0') * 100),
        item_type: item.item_type,
      }));

      await api.post(`/estimates/jobs/${jobId}`, {
        line_items: formattedItems,
        tax_rate_percent: parseFloat(taxRate || '0'),
        notes: estNotes.trim() || null,
        expires_in_days: parseInt(estExpiresDays, 10) || 14,
        currency: 'USD',
      });

      setActiveModal(null);
      await loadJobData();
    } catch (err) {
      alert(err.message || 'Failed to create estimate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartWork = async () => {
    if (!window.confirm('Start approved repair execution? Status will move to IN_PROGRESS.')) return;
    setSubmitting(true);
    try {
      await api.post(`/repair-jobs/${jobId}/transition`, {
        to_status: 'IN_PROGRESS',
        reason: 'Technician initiated approved repair execution',
      });
      await loadJobData();
    } catch (err) {
      alert(err.message || 'Failed to move to IN_PROGRESS');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteWork = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parts = partsReplacedInput
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);

      await api.post(`/repair-jobs/${jobId}/complete-work`, {
        work_performed: workPerformed.trim(),
        parts_replaced: parts,
      });

      setActiveModal(null);
      await loadJobData();
    } catch (err) {
      alert(err.message || 'Failed to complete work');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHandoverAndWarranty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Issue verified warranty
      await api.post(`/warranties/jobs/${jobId}`, {
        duration_days: parseInt(warrantyDays, 10),
        covered_terms: warrantyTerms.trim(),
        limitations: warrantyExclusions.trim() || null,
      });

      // 2. Record handover
      await api.post(`/repair-jobs/${jobId}/handover`, {
        collected_by_name: collectorName.trim(),
        confirmation_notes: 'Handover complete and verified in shop.',
      });

      setActiveModal(null);
      await loadJobData();
    } catch (err) {
      alert(err.message || 'Handover failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusHold = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/repair-jobs/${jobId}/transition`, {
        to_status: 'ON_HOLD',
        reason: statusReason.trim(),
      });
      setActiveModal(null);
      setStatusReason('');
      await loadJobData();
    } catch (err) {
      alert(err.message || 'Failed to put job on hold');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving job and workshop state..." fullPage />;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  const latestEstimate = job.latest_estimate;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div>
        <Link
          to="/business/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft size={14} /> Back to Workshop Dashboard
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
              Customer: <strong className="text-slate-700">{job.customer_summary?.full_name}</strong>{' '}
              ({job.customer_summary?.phone || job.customer_summary?.email})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/customer/passports/${job.asset_id}`}
              className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Layers size={14} /> Inspect Repair Passport
            </Link>
          </div>
        </div>
      </div>

      {/* Workshop Operational Action Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Technician Workshop Actions
          </span>
          <span className="text-[11px] text-slate-400">Current Phase: {job.status}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {job.status === 'REQUESTED' && (
            <button
              onClick={() => setActiveModal('intake')}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Document Intake Condition & Check In
            </button>
          )}

          {['CHECKED_IN', 'DIAGNOSING'].includes(job.status) && (
            <>
              <button
                onClick={() => setActiveModal('diagnosis')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Record Technical Diagnosis
              </button>
              <button
                onClick={() => setActiveModal('estimate')}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Prepare & Submit Estimate
              </button>
            </>
          )}

          {job.status === 'AWAITING_APPROVAL' && (
            <div className="text-xs text-orange-700 font-semibold bg-orange-50 px-3.5 py-2 rounded-xl border border-orange-200 flex items-center gap-2">
              <Clock size={16} /> Awaiting customer approval. Repair work is locked until approved.
            </div>
          )}

          {job.status === 'APPROVED' && (
            <button
              onClick={handleStartWork}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} /> Begin Approved Repair Work
            </button>
          )}

          {job.status === 'IN_PROGRESS' && (
            <>
              <button
                onClick={() => setActiveModal('complete_work')}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Check size={16} /> Mark Work Complete & Ready
              </button>
              <button
                onClick={() => setActiveModal('hold')}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Put On Hold (Waiting for Parts)
              </button>
            </>
          )}

          {job.status === 'READY_FOR_COLLECTION' && (
            <button
              onClick={() => setActiveModal('handover')}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <ShieldCheck size={16} /> Customer Handover & Issue Warranty
            </button>
          )}

          {job.status === 'COLLECTED' && (
            <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 size={16} /> Item handed over and warranty certificate stamped.
            </div>
          )}
        </div>
      </div>

      {/* Workflow Step Timeline */}
      <Timeline currentStatus={job.status} events={job.events} />

      {/* Active Estimate Display */}
      {latestEstimate && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">Active Estimate (v{latestEstimate.version})</h3>
              <StatusBadge status={latestEstimate.status} />
            </div>
            <div className="font-mono font-bold text-base text-slate-900">
              ${(latestEstimate.total_minor / 100).toFixed(2)} {latestEstimate.currency}
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {latestEstimate.line_items.map((item, i) => (
              <div key={i} className="py-2.5 flex justify-between">
                <span>{item.description} ({item.quantity}x)</span>
                <span className="font-mono font-semibold">${(item.total_minor / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {latestEstimate.decision_notes && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold">Customer Decision Notes: </span>
              {latestEstimate.decision_notes}
            </div>
          )}
        </div>
      )}

      {/* Intake Modal */}
      <Modal isOpen={activeModal === 'intake'} onClose={() => setActiveModal(null)} title="Document Intake Condition & Check In">
        <form onSubmit={handleSaveIntake} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Physical Exterior Condition *</label>
            <textarea
              rows={3}
              required
              placeholder="Document scratches, dents, cracked glass, bent frame, liquid residue..."
              value={physicalCondition}
              onChange={(e) => setPhysicalCondition(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Accessories Included with Item</label>
            <input
              type="text"
              placeholder="e.g. 65W charger, sleeve, pedals, stylus pen"
              value={accessories}
              onChange={(e) => setAccessories(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl">
              Save Intake Condition
            </button>
          </div>
        </form>
      </Modal>

      {/* Diagnosis Modal */}
      <Modal isOpen={activeModal === 'diagnosis'} onClose={() => setActiveModal(null)} title="Record Technical Diagnosis">
        <form onSubmit={handleSaveDiagnosis} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Diagnosis Summary *</label>
            <input
              type="text"
              required
              placeholder="e.g. Swollen battery cell, broken HDMI controller IC"
              value={diagSummary}
              onChange={(e) => setDiagSummary(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Detailed Technical Findings *</label>
            <textarea
              rows={4}
              required
              placeholder="Detail component test results, multimeter voltages, required replacements..."
              value={diagFindings}
              onChange={(e) => setDiagFindings(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl">
              Save Diagnostic Report
            </button>
          </div>
        </form>
      </Modal>

      {/* Estimate Builder Modal */}
      <Modal isOpen={activeModal === 'estimate'} onClose={() => setActiveModal(null)} title="Prepare & Submit Itemized Estimate" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateEstimate} className="space-y-5 text-xs">
          <p className="text-slate-500">
            Line items will be frozen in version history. Once submitted, the job advances to AWAITING_APPROVAL.
          </p>

          <div className="space-y-2">
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => {
                    const u = [...lineItems];
                    u[idx].description = e.target.value;
                    setLineItems(u);
                  }}
                  className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <select
                  value={item.item_type}
                  onChange={(e) => {
                    const u = [...lineItems];
                    u[idx].item_type = e.target.value;
                    setLineItems(u);
                  }}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="parts">Parts</option>
                  <option value="labor">Labor</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="fee">Fee</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const u = [...lineItems];
                    u[idx].quantity = e.target.value;
                    setLineItems(u);
                  }}
                  className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-xs text-center"
                />
                <input
                  type="text"
                  placeholder="Price $"
                  value={item.unit_price_dollars}
                  onChange={(e) => {
                    const u = [...lineItems];
                    u[idx].unit_price_dollars = e.target.value;
                    setLineItems(u);
                  }}
                  className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, unit_price_dollars: '0.00', item_type: 'parts' }])}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1"
            >
              <Plus size={12} /> Add Line Item
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Tax Rate (%)</label>
              <input
                type="text"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Estimate Valid For (Days)</label>
              <input
                type="number"
                value={estExpiresDays}
                onChange={(e) => setEstExpiresDays(e.target.value)}
                className="w-full p-2 bg-slate-50 border rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl">
              Submit Estimate for Customer Approval
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Work Modal */}
      <Modal isOpen={activeModal === 'complete_work'} onClose={() => setActiveModal(null)} title="Record Work Completion">
        <form onSubmit={handleCompleteWork} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Itemized Work Performed *</label>
            <textarea
              rows={4}
              required
              placeholder="Describe work completed, calibrations performed, stress testing results..."
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Parts Replaced (One per line)</label>
            <textarea
              rows={3}
              placeholder="e.g. OEM Battery Assembly&#10;Waterproof Gasket Seal"
              value={partsReplacedInput}
              onChange={(e) => setPartsReplacedInput(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl">
              Mark Ready for Pickup
            </button>
          </div>
        </form>
      </Modal>

      {/* Handover & Warranty Modal */}
      <Modal isOpen={activeModal === 'handover'} onClose={() => setActiveModal(null)} title="Customer Handover & Issue Warranty Certificate">
        <form onSubmit={handleHandoverAndWarranty} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Collected By Name *</label>
            <input
              type="text"
              required
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Warranty Validity Duration (Days) *</label>
            <input
              type="number"
              required
              value={warrantyDays}
              onChange={(e) => setWarrantyDays(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Warranty Coverage Terms *</label>
            <textarea
              rows={2}
              required
              value={warrantyTerms}
              onChange={(e) => setWarrantyTerms(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Warranty Limitations / Exclusions</label>
            <input
              type="text"
              value={warrantyExclusions}
              onChange={(e) => setWarrantyExclusions(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl">
              Confirm Handover & Issue Warranty
            </button>
          </div>
        </form>
      </Modal>

      {/* Hold Reason Modal */}
      <Modal isOpen={activeModal === 'hold'} onClose={() => setActiveModal(null)} title="Put Repair Job On Hold">
        <form onSubmit={handleStatusHold} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Reason for Pausing Work (Mandatory) *</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Waiting for factory shipment of replacement logic board from supplier..."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting || !statusReason.trim()} className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl">
              Put On Hold
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
