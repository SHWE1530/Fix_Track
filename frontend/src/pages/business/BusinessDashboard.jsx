import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Users,
  Settings,
  ArrowRight,
  Search,
  FileText
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import CategoryIcon from '../../components/CategoryIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [biz, jobsData] = await Promise.all([
          api.get('/businesses/my'),
          api.get('/repair-jobs'),
        ]);
        setBusiness(biz);
        setJobs(jobsData);
      } catch (err) {
        console.error('Failed to load business dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading workshop management console..." fullPage />;
  }

  if (!business) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-5">
        <Store size={48} className="mx-auto text-brand-600" />
        <h2 className="text-2xl font-bold text-slate-900">Set Up Your Repair Business</h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          You are signed in with a business account, but have not configured your workshop profile yet.
        </p>
        <Link
          to="/business/profile?new=true"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20"
        >
          Create Business Profile <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // Workshop Queue Metrics
  const requestedJobs = jobs.filter((j) => j.status === 'REQUESTED');
  const diagnosingJobs = jobs.filter((j) => ['CHECKED_IN', 'DIAGNOSING'].includes(j.status));
  const awaitingApprovalJobs = jobs.filter((j) => j.status === 'AWAITING_APPROVAL');
  const inProgressJobs = jobs.filter((j) => j.status === 'IN_PROGRESS');
  const readyJobs = jobs.filter((j) => j.status === 'READY_FOR_COLLECTION');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Workshop Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Workshop Console
            </span>
            {business.is_verified && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={12} /> Verified Shop
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {business.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {business.address} &bull; {business.phone}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user.role === 'business_owner' && (
            <>
              <Link
                to="/business/staff"
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Users size={14} /> Staff
              </Link>
              <Link
                to="/business/profile"
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Settings size={14} /> Shop Settings
              </Link>
            </>
          )}
          <Link
            to="/business/jobs"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-brand-500/20 transition-all flex items-center gap-1.5"
          >
            <Wrench size={14} /> View All Jobs
          </Link>
        </div>
      </div>

      {/* Workshop Queue Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">New Requests</div>
          <div className="text-2xl font-black text-slate-900">{requestedJobs.length}</div>
          <div className="text-[10px] text-amber-600 font-semibold">Needs check-in</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Diagnosis</div>
          <div className="text-2xl font-black text-slate-900">{diagnosingJobs.length}</div>
          <div className="text-[10px] text-purple-600 font-semibold">Testing & inspecting</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Approval</div>
          <div className="text-2xl font-black text-slate-900">{awaitingApprovalJobs.length}</div>
          <div className="text-[10px] text-orange-600 font-semibold">Estimate with customer</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Progress</div>
          <div className="text-2xl font-black text-slate-900">{inProgressJobs.length}</div>
          <div className="text-[10px] text-teal-600 font-semibold">Approved repairs active</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 col-span-2 md:col-span-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ready for Pickup</div>
          <div className="text-2xl font-black text-slate-900">{readyJobs.length}</div>
          <div className="text-[10px] text-indigo-600 font-semibold">Ready for collection</div>
        </div>
      </div>

      {/* Active Workshop Jobs Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Workshop Queue</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Service requests undergoing intake, diagnosis, estimate approval, and repair execution
            </p>
          </div>
          <Link
            to="/business/jobs"
            className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
          >
            Open Complete Queue <ArrowRight size={14} />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Workshop queue is empty"
            description="Customers will appear here when they book service requests or bring items in."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Job Reference</th>
                  <th className="pb-3">Asset</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Opened</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.slice(0, 10).map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-slate-800">
                      {job.job_number}
                      {job.repeat_fault_job_number && (
                        <span className="block text-[10px] text-indigo-600 font-sans font-medium">
                          Repeat Fault
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-semibold text-slate-900">
                      {job.asset_summary?.make} {job.asset_summary?.model}
                    </td>
                    <td className="py-3 text-slate-600">
                      <div className="font-medium text-slate-800">{job.customer_summary?.full_name}</div>
                      <div className="text-[10px] text-slate-400">{job.customer_summary?.phone || job.customer_summary?.email}</div>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={job.status} size="sm" />
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/business/jobs/${job.id}`}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        Manage <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
