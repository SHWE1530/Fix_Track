import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  CheckCircle,
  Wrench,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Asset Registration & Repair Request',
      actor: 'Customer',
      desc: 'Register any device, vehicle, or appliance with common serial identifiers and custom metadata. Select a certified shop and submit your reported symptoms.',
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      number: '02',
      title: 'Formal Shop Check-In & Intake Audit',
      actor: 'Shop Technician',
      desc: 'The repair shop physically receives the item, inspects external condition (scratches, dents, cracks), logs included accessories, and takes verification photos.',
      icon: Search,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      number: '03',
      title: 'Technical Diagnosis & Immutable Estimate',
      actor: 'Technician',
      desc: 'Technicians diagnose the fault and prepare an itemized estimate with parts, labor, taxes, and validity terms. Once submitted, the estimate version is frozen.',
      icon: Wrench,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      number: '04',
      title: 'Customer Decision Gate (No Work Without Approval)',
      actor: 'Customer',
      desc: 'The customer reviews the line items. You can approve, reject, or request changes. Work cannot legally or systematically begin until you grant approval.',
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      number: '05',
      title: 'Repair Execution & Real-Time Tracking',
      actor: 'Technician',
      desc: 'The technician executes the authorized repair, records replaced part serial numbers, and updates milestones. If on hold for parts, a clear reason is documented.',
      icon: Clock,
      color: 'text-teal-600 bg-teal-50 border-teal-200'
    },
    {
      number: '06',
      title: 'Handover & Verifiable Warranty Issuance',
      actor: 'Customer & Shop',
      desc: 'Upon collection, handover is signed off and an explicit warranty certificate is generated with duration, coverage terms, and contact points.',
      icon: Shield,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      number: '07',
      title: 'Portable Repair Passport & Granular Sharing',
      actor: 'Customer',
      desc: 'All validated service records are preserved in your Repair Passport. Share records with another repair provider anytime using temporary, revocable access grants.',
      icon: Layers,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          The Lifecycle of Trust
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How FixTrack Works
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          From first intake to multi-shop record sharing, FixTrack enforces transparent gates and immutable audit trails across every stage of the repair process.
        </p>
      </div>

      {/* Workflow Rule Alert */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-3">
        <AlertCircle size={20} className="text-teal-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-teal-900 space-y-1">
          <span className="font-bold">System Enforcement:</span>
          <p className="leading-relaxed">
            FixTrack enforces valid state transitions in the backend server. A repair job cannot move to <code>IN_PROGRESS</code> without an approved estimate version, and estimates cannot be silently modified after submission.
          </p>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-6">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6"
            >
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-2xl font-black text-slate-300 font-mono">{s.number}</span>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${s.color}`}>
                  <Icon size={24} />
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{s.title}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    {s.actor}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Call to action */}
      <div className="text-center pt-8">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all"
        >
          Join FixTrack Today <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
