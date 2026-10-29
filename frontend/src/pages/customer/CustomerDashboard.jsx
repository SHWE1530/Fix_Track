import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Wrench,
  ShieldCheck,
  AlertCircle,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Share2,
  FileText
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import CategoryIcon from '../../components/CategoryIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [warranties, setWarranties] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [assetsData, jobsData, warrantiesData] = await Promise.all([
          api.get('/assets'),
          api.get('/repair-jobs'),
          api.get('/warranties'),
        ]);
        setAssets(assetsData);
        setJobs(jobsData);
        setWarranties(warrantiesData);
      } catch (err) {
        console.error('Failed to load customer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading customer service center..." fullPage />;
  }

  const awaitingApprovalJobs = jobs.filter((j) => j.status === 'AWAITING_APPROVAL');
  const activeJobs = jobs.filter(
    (j) => !['CLOSED', 'CANCELLED', 'COLLECTED'].includes(j.status)
  );
  const activeWarranties = warranties.filter((w) => w.is_active);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customer Repair Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track active service jobs, approve estimates, and manage portable Repair Passports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/customer/assets/new"
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} /> Register Asset
          </Link>
          <Link
            to="/customer/requests/new"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-brand-500/20 transition-all flex items-center gap-1.5"
          >
            <Wrench size={14} /> New Repair Request
          </Link>
        </div>
      </div>

      {/* Urgent Approval Banner if any */}
      {awaitingApprovalJobs.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-bold text-sm">Action Required: Estimate Awaiting Approval</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                You have {awaitingApprovalJobs.length} itemized repair estimate(s) ready for review. Work cannot start until approved.
              </p>
            </div>
          </div>
          <Link
            to={`/customer/jobs/${awaitingApprovalJobs[0].id}`}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-sm transition-all"
          >
            Review Estimate
          </Link>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Assets</span>
            <Layers size={18} className="text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{assets.length}</div>
          <div className="text-[11px] text-slate-400">With digital service history</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Repairs</span>
            <Clock size={18} className="text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeJobs.length}</div>
          <div className="text-[11px] text-slate-400">Under diagnostic or workshop care</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting Decision</span>
            <AlertCircle size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{awaitingApprovalJobs.length}</div>
          <div className="text-[11px] text-slate-400">Estimates submitted to you</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Warranties</span>
            <ShieldCheck size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeWarranties.length}</div>
          <div className="text-[11px] text-slate-400">Verified terms in effect</div>
        </div>
      </div>

      {/* Main Grid: Active Repairs & Registered Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Repairs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench size={16} className="text-brand-600" /> Active Repair Jobs
            </h2>
            <Link
              to="/customer/jobs"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all ({jobs.length}) <ArrowRight size={12} />
            </Link>
          </div>

          {jobs.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No repair jobs created yet"
              description="Start a repair request by choosing a registered asset and verified workshop."
              actionLabel="Submit First Repair"
              actionLink="/customer/requests/new"
            />
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  to={`/customer/jobs/${job.id}`}
                  className="block bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-500/50 hover:shadow-md transition-all space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-mono text-xs font-bold">
                        {job.asset_summary?.category ? (
                          <CategoryIcon category={job.asset_summary.category} size={16} />
                        ) : (
                          <Wrench size={16} />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                          {job.asset_summary?.make} {job.asset_summary?.model}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {job.job_number} &bull; {job.business_summary?.name || 'Repair Center'}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    <span className="font-semibold text-slate-700">Issue:</span> {job.reported_issue}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>Opened {new Date(job.created_at).toLocaleDateString()}</span>
                    {job.latest_estimate && (
                      <span className="font-semibold text-slate-700">
                        Est: {job.latest_estimate.currency} {(job.latest_estimate.total_minor / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Registered Assets & Repair Passports */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-teal-600" /> My Assets & Passports
            </h2>
            <Link
              to="/customer/assets"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Manage ({assets.length}) <ArrowRight size={12} />
            </Link>
          </div>

          {assets.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No assets registered"
              description="Register your smartphone, laptop, bike, or appliance to initiate service records."
              actionLabel="Add Asset"
              actionLink="/customer/assets/new"
            />
          ) : (
            <div className="space-y-3">
              {assets.slice(0, 4).map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <CategoryIcon category={asset.category} size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          {asset.make} {asset.model}
                        </h4>
                        <div className="text-[10px] text-slate-400 font-mono">
                          SN: {asset.serial_number || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {asset.total_repairs_count || 0} repairs
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link
                      to={`/customer/passports/${asset.id}`}
                      className="flex-1 py-1.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Layers size={12} /> View Repair Passport
                    </Link>
                    <Link
                      to={`/customer/requests/new?asset_id=${asset.id}`}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} /> Repair
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
