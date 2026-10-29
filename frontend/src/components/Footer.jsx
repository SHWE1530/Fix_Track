import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, CheckCircle2, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-extrabold text-lg">
              <div className="h-8 w-8 rounded-lg bg-brand-500 text-slate-900 flex items-center justify-center">
                <Wrench size={16} className="rotate-45" />
              </div>
              FixTrack
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              The cross-service repair transparency platform with customer-controlled Repair Passports and verifiable warranties.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-teal-400">
              <Shield size={14} /> Open Transparency Standard
            </div>
          </div>

          {/* Core Categories */}
          <div>
            <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">Categories</h4>
            <ul className="space-y-2">
              <li><Link to="/categories" className="hover:text-white transition-colors">Smartphones & Tablets</Link></li>
              <li><Link to="/categories" className="hover:text-white transition-colors">Laptops & Computers</Link></li>
              <li><Link to="/categories" className="hover:text-white transition-colors">Home Appliances</Link></li>
              <li><Link to="/categories" className="hover:text-white transition-colors">Bicycles & E-Bikes</Link></li>
              <li><Link to="/categories" className="hover:text-white transition-colors">Cars & Motorcycles</Link></li>
            </ul>
          </div>

          {/* Transparency Pillars */}
          <div>
            <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">Platform Guarantees</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-teal-400" /> Immutable Estimates</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-teal-400" /> Portable Service Ledger</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-teal-400" /> Granular Sharing Access</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-teal-400" /> Repeat-Fault Protection</li>
            </ul>
          </div>

          {/* Compliance & Security */}
          <div>
            <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">Security & Privacy</h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Customer service records are protected with explicit, expiring, revocable sharing grants. Private technician diagnostics remain strictly separated.
            </p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Lock size={12} /> Server-Side Enforced RBAC
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} FixTrack Platform. Conventional deterministic software architecture.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/how-it-works" className="hover:text-slate-400">How it Works</Link>
            <Link to="/directory" className="hover:text-slate-400">Directory</Link>
            <Link to="/categories" className="hover:text-slate-400">Categories</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
