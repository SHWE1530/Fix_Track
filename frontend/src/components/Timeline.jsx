import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

const WORKFLOW_STEPS = [
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'CHECKED_IN', label: 'Checked In' },
  { key: 'DIAGNOSING', label: 'Diagnosing' },
  { key: 'AWAITING_APPROVAL', label: 'Estimate Review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'READY_FOR_COLLECTION', label: 'Ready for Pickup' },
  { key: 'COLLECTED', label: 'Collected' },
  { key: 'CLOSED', label: 'Closed' },
];

export default function Timeline({ currentStatus, events = [] }) {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';
  const isOnHold = currentStatus === 'ON_HOLD';

  return (
    <div className="space-y-6">
      {/* Progress Milestone Bar */}
      {!isCancelled && (
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center min-w-[700px] justify-between relative">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-brand-500 transition-all duration-500 -z-0"
              style={{
                width: `${Math.max(0, (currentIndex / (WORKFLOW_STEPS.length - 1)) * 100)}%`,
              }}
            />

            {WORKFLOW_STEPS.map((step, idx) => {
              const isPassed = currentIndex > idx;
              const isCurrent = currentIndex === idx;

              return (
                <div key={step.key} className="flex flex-col items-center z-10 px-1 text-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      isPassed
                        ? 'bg-brand-600 text-white shadow-sm'
                        : isCurrent
                        ? isOnHold
                          ? 'bg-rose-500 text-white ring-4 ring-rose-100'
                          : 'bg-brand-500 text-white ring-4 ring-brand-100 animate-pulse'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium whitespace-nowrap ${
                      isCurrent
                        ? 'text-brand-700 font-bold'
                        : isPassed
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Special status banners */}
      {isCancelled && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <XCircle className="text-rose-600 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-semibold text-sm">Repair Job Cancelled</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              This job has been cancelled and closed. Details and reasons are documented in the audit trail below.
            </p>
          </div>
        </div>
      )}

      {isOnHold && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-semibold text-sm">Job Temporarily Paused (On Hold)</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Technician has placed this repair on hold (e.g. waiting for specialized parts or customer clarification).
            </p>
          </div>
        </div>
      )}

      {/* Granular Audit Event Log */}
      <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-brand-600" /> Verified Audit History & Events
        </h3>

        {events.length === 0 ? (
          <p className="text-xs text-slate-400">No events recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {events.map((evt, i) => (
              <div key={evt.id || i} className="flex items-start gap-3 text-xs">
                <div className="h-2 w-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {evt.from_status ? (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          {evt.from_status} <ArrowRight size={12} className="text-slate-400" /> {evt.to_status}
                        </span>
                      ) : (
                        <span>Initial: {evt.to_status}</span>
                      )}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(evt.created_at).toLocaleString()}
                    </span>
                  </div>
                  {evt.reason && (
                    <p className="text-slate-600 mt-0.5 italic bg-slate-50 p-2 rounded-md border border-slate-100">
                      "{evt.reason}"
                    </p>
                  )}
                  <div className="mt-1 text-[11px] text-slate-400">
                    Recorded by <span className="font-medium text-slate-600">{evt.actor_name || 'System'}</span> ({evt.actor_role})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
