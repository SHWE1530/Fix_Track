import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Search, Plus, Filter, ArrowRight, Store, Clock } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import CategoryIcon from '../../components/CategoryIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'CHECKED_IN', label: 'Checked In' },
  { value: 'DIAGNOSING', label: 'Diagnosing' },
  { value: 'AWAITING_APPROVAL', label: 'Awaiting Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'READY_FOR_COLLECTION', label: 'Ready for Pickup' },
  { value: 'COLLECTED', label: 'Collected' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function MyRepairJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      try {
        const query = statusFilter ? `?status=${statusFilter}` : '';
        const data = await api.get(`/repair-jobs${query}`);
        setJobs(data);
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [statusFilter]);

  const filteredJobs = jobs.filter((j) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      j.job_number?.toLowerCase().includes(term) ||
      j.reported_issue?.toLowerCase().includes(term) ||
      j.asset_summary?.make?.toLowerCase().includes(term) ||
      j.asset_summary?.model?.toLowerCase().includes(term) ||
      j.business_summary?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Repair Jobs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track current and archived repair services, estimate approvals, and inspection logs
          </p>
        </div>
        <Link
          to="/customer/requests/new"
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> New Repair Request
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by job #, asset, workshop, or symptom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Job Cards */}
      {loading ? (
        <LoadingSpinner text="Loading repair records..." fullPage />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No repair jobs found"
          description="No repair jobs match your current search or status filter."
          actionLabel="Submit a Repair Request"
          actionLink="/customer/requests/new"
        />
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Link
              key={job.id}
              to={`/customer/jobs/${job.id}`}
              className="block bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-500/50 hover:shadow-md transition-all space-y-4 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    <CategoryIcon category={job.asset_summary?.category || 'other'} size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{job.job_number}</span>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                        {job.asset_summary?.make} {job.asset_summary?.model}
                      </h3>
                      {job.repeat_fault_job_number && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                          Repeat Fault
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><Store size={12} /> {job.business_summary?.name}</span>
                      <span>&bull;</span>
                      <span>Opened on {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <StatusBadge status={job.status} />
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <strong className="text-slate-700">Reported Issue: </strong>
                {job.reported_issue}
              </p>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  {job.latest_estimate && (
                    <span className="font-semibold text-slate-800">
                      Estimate: ${(job.latest_estimate.total_minor / 100).toFixed(2)} ({job.latest_estimate.currency}) &bull; v{job.latest_estimate.version}
                    </span>
                  )}
                  {job.active_warranty && (
                    <span className="text-emerald-700 font-medium">
                      Warranty Active ({job.active_warranty.duration_days} days)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-brand-600 font-semibold group-hover:underline">
                  View Timeline & Details &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
