import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Wrench, ArrowLeft, AlertCircle, Check, Store, Layers, AlertTriangle } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function NewRepairRequestPage() {
  const [searchParams] = useSearchParams();
  const preselectedAssetId = searchParams.get('asset_id') || '';
  const preselectedBusinessId = searchParams.get('business_id') || '';
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [priorJobs, setPriorJobs] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState(preselectedAssetId);
  const [selectedBusinessId, setSelectedBusinessId] = useState(preselectedBusinessId);
  const [reportedIssue, setReportedIssue] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isRepeatFault, setIsRepeatFault] = useState(false);
  const [repeatJobId, setRepeatJobId] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [assetsData, bizData, allJobs] = await Promise.all([
          api.get('/assets'),
          api.get('/businesses/directory'),
          api.get('/repair-jobs'),
        ]);
        setAssets(assetsData);
        setBusinesses(bizData);

        if (!selectedAssetId && assetsData.length > 0) {
          setSelectedAssetId(assetsData[0].id);
        }
        if (!selectedBusinessId && bizData.length > 0) {
          setSelectedBusinessId(bizData[0].id);
        }

        // Filter earlier closed/collected jobs for repeat fault candidate list
        const eligiblePrior = allJobs.filter(
          (j) => ['COLLECTED', 'CLOSED'].includes(j.status)
        );
        setPriorJobs(eligiblePrior);
      } catch (err) {
        console.error('Failed to load request dependencies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);

  // Check if selected business supports selected asset's category
  const isCategorySupported =
    selectedAsset &&
    selectedBusiness &&
    selectedBusiness.supported_categories?.includes(selectedAsset.category);

  // Prior jobs for selected asset
  const assetPriorJobs = priorJobs.filter((j) => j.asset_id === selectedAssetId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedAssetId) {
      setError('Please select an asset');
      return;
    }
    if (!selectedBusinessId) {
      setError('Please select a repair business');
      return;
    }
    if (!isCategorySupported) {
      setError(`The selected business does not support ${selectedAsset?.category}. Please choose another workshop.`);
      return;
    }
    if (!reportedIssue.trim() || reportedIssue.length < 5) {
      setError('Please provide a detailed description of the reported fault (min 5 characters)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        asset_id: selectedAssetId,
        business_id: selectedBusinessId,
        reported_issue: reportedIssue.trim(),
        customer_notes: customerNotes.trim() || null,
        repeat_fault_of_job_id: isRepeatFault && repeatJobId ? repeatJobId : null,
      };

      const newJob = await api.post('/repair-jobs', payload);
      navigate(`/customer/jobs/${newJob.id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit repair request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Preparing repair intake forms..." fullPage />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          to="/customer/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Repair Request</h1>
        <p className="text-xs text-slate-500 mt-1">
          Initiate a new repair job with a certified workshop under transparent estimate and warranty rules
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {assets.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
          <Layers size={36} className="mx-auto text-brand-600" />
          <h3 className="font-bold text-slate-900 text-base">You haven't registered any assets yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Before submitting a repair request, please register your phone, laptop, appliance, or bicycle so it receives a permanent Repair Passport.
          </p>
          <Link
            to="/customer/assets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm"
          >
            Register Item First
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          {/* Step 1: Asset Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>1. Select Registered Asset</span>
              <Link to="/customer/assets/new" className="text-brand-600 hover:underline normal-case text-xs font-medium">
                + Register different item
              </Link>
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.make} {a.model} &bull; {a.category} {a.serial_number ? `(${a.serial_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Target Repair Business */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Select Participating Repair Shop
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} &bull; {b.address} {b.is_verified ? '✓ Verified' : ''}
                </option>
              ))}
            </select>

            {!isCategorySupported && selectedAsset && selectedBusiness && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                <span>
                  {selectedBusiness.name} does not service category '{selectedAsset.category}'. Please select another shop from the directory.
                </span>
              </div>
            )}
          </div>

          {/* Step 3: Reported Issue */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Reported Symptoms & Defect Description *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe the malfunction, when it began, any error messages, unusual sounds, or dropped damage..."
              value={reportedIssue}
              onChange={(e) => setReportedIssue(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Customer Notes & Special Requests</label>
            <input
              type="text"
              placeholder="e.g. Please call before ordering parts over $200, backup data already made"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Optional: Repeat-Fault Linking */}
          {assetPriorJobs.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="repeatFaultToggle"
                  checked={isRepeatFault}
                  onChange={(e) => setIsRepeatFault(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="repeatFaultToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                  This is a recurring defect (Repeat Fault under earlier repair)
                </label>
              </div>

              {isRepeatFault && (
                <div className="space-y-1.5 pl-6 animate-in fade-in duration-150">
                  <label className="text-xs font-semibold text-slate-600">Select Prior Completed Repair Job:</label>
                  <select
                    value={repeatJobId}
                    onChange={(e) => setRepeatJobId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="">-- Choose prior service job --</option>
                    {assetPriorJobs.map((pj) => (
                      <option key={pj.id} value={pj.id}>
                        {pj.job_number} &bull; {pj.reported_issue.substring(0, 50)}... ({new Date(pj.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-teal-700 flex items-center gap-1 mt-1">
                    <Check size={12} /> Linking this job will automatically present prior repair warranties for warranty claim review.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/customer/dashboard"
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !isCategorySupported}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check size={14} /> {submitting ? 'Submitting Request...' : 'Submit Repair Request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
