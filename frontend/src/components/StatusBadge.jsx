import React from 'react';

const STATUS_CONFIG = {
  REQUESTED: { label: 'Requested', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  CHECKED_IN: { label: 'Checked In', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  DIAGNOSING: { label: 'Diagnosing', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  AWAITING_APPROVAL: { label: 'Awaiting Approval', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', pulse: true },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  ON_HOLD: { label: 'On Hold', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  READY_FOR_COLLECTION: { label: 'Ready for Collection', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', pulse: true },
  COLLECTED: { label: 'Collected', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  CLOSED: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },

  // Estimates
  draft: { label: 'Draft', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  submitted: { label: 'Awaiting Decision', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { label: 'Changes Requested / Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  superseded: { label: 'Superseded', bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200' },

  // Warranties & Grants
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  expired: { label: 'Expired', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
  revoked: { label: 'Revoked', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.pulse ? 'animate-ping' : ''} bg-current`} />
      {config.label}
    </span>
  );
}
