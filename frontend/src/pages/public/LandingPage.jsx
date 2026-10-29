import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileCheck2,
  Share2,
  Clock,
  ArrowRight,
  CheckCircle,
  Wrench,
  Sparkles,
  Smartphone,
  Laptop,
  Home,
  Bike,
  Car,
  Armchair,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                <Sparkles size={14} className="text-teal-600" />
                Cross-Service Repair Transparency
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Complete repair transparency. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-teal-500">
                  Your portable Repair Passport.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                FixTrack connects item owners and independent repair businesses. Review itemized immutable estimates before authorizing work, verify warranty terms, and control an authentic service history across participating shops.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                {user ? (
                  <Link
                    to={user.role === 'customer' ? '/customer/dashboard' : '/business/dashboard'}
                    className="w-full sm:w-auto px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    Open My Dashboard <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      Create Free Account <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/directory"
                      className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      Browse Certified Shops
                    </Link>
                  </>
                )}
              </div>

              {/* Quick feature highlights */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left border-t border-slate-200/60">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <CheckCircle size={16} className="text-teal-600 flex-shrink-0" />
                  <span>Immutable Estimates</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <CheckCircle size={16} className="text-teal-600 flex-shrink-0" />
                  <span>Repeat-Fault Linking</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <CheckCircle size={16} className="text-teal-600 flex-shrink-0" />
                  <span>Customer Sharing Grants</span>
                </div>
              </div>
            </div>

            {/* Visual Hero Mockup Card */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 space-y-5 relative z-10">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Layers size={20} />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Repair Passport</div>
                      <div className="font-bold text-slate-900 text-sm">Lenovo ThinkPad X1 Carbon</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                    Warranty Active
                  </span>
                </div>

                {/* Estimate approval snippet */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">Estimate v1 &bull; Apex Tech Solutions</span>
                    <span className="font-bold text-slate-900">$429.84</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>OEM 2.8K OLED Display Assembly</span>
                      <span>$240.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>eDP 40-pin Video Ribbon Harness</span>
                      <span>$28.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Micro-soldering & Calibration Labor</span>
                      <span>$130.00</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Customer status:</span>
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Approved by Alice Morgan
                    </span>
                  </div>
                </div>

                {/* Passport stamp snippet */}
                <div className="p-3.5 rounded-xl border border-dashed border-teal-300 bg-teal-50/50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-teal-900">90-Day Factory Warranty</div>
                    <div className="text-teal-700 text-[11px]">Valid until Jan 18, 2027</div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
                    WAR
                  </div>
                </div>
              </div>

              {/* Decorative blur backdrop */}
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-teal-200 rounded-full filter blur-3xl opacity-40 -z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of Transparency */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs uppercase font-bold tracking-widest text-brand-600">Core Architecture</h2>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">Built for absolute repair trust</p>
          <p className="text-xs text-slate-500 mt-2">
            No hidden markups. No verbal ambiguities. No unverified warranty claims.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FileCheck2 size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Immutable Estimates</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Once an estimate is prepared and submitted, its line items are frozen in version history. Revisions generate explicit new versions requiring re-approval.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Share2 size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Portable Repair Passport</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The customer owns their asset's service records. Share diagnostic histories securely with any new participating shop using time-limited, revocable grants.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Verifiable Warranties</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upon collection, every completed repair generates an explicit warranty record with clear covered terms, end dates, and exclusions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Repeat-Fault Linking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an issue reoccurs, link the new request directly to the original job and active warranty to claim warranty repairs without friction.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-xs uppercase font-bold tracking-widest text-teal-400">Versatile System</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Configurable Repair Categories
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-xl leading-relaxed">
                One unified repair workflow engine supporting phones, computers, appliances, bicycles, vehicles, and furniture with extensible metadata.
              </p>
            </div>
            <Link
              to="/categories"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              Explore Category System <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Smartphone, label: 'Smartphones & Tablets' },
              { icon: Laptop, label: 'Laptops & Computers' },
              { icon: Home, label: 'Home Appliances' },
              { icon: Bike, label: 'Bicycles & E-Bikes' },
              { icon: Car, label: 'Cars & Motorcycles' },
              { icon: Armchair, label: 'Furniture & Goods' },
            ].map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div key={i} className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 text-center space-y-2 hover:border-teal-500/50 transition-colors">
                  <div className="h-10 w-10 mx-auto rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <div className="font-semibold text-xs text-slate-200">{cat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Test Drive Credentials Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl border border-teal-200 p-8 sm:p-10 text-center space-y-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">Interactive Demo Test-Drive</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto mt-2 leading-relaxed">
              Explore FixTrack immediately using our pre-seeded demonstration accounts. Each account provides role-specific permissions and realistic job data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
              <div className="font-bold text-xs text-slate-900">Customer (Alice)</div>
              <div className="text-[11px] text-slate-500">customer@example.com</div>
              <div className="text-[11px] text-teal-600 font-mono mt-1">CustomerPass123!</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
              <div className="font-bold text-xs text-slate-900">Shop Owner (Marcus)</div>
              <div className="text-[11px] text-slate-500">owner@apexrepair.com</div>
              <div className="text-[11px] text-teal-600 font-mono mt-1">OwnerPass123!</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
              <div className="font-bold text-xs text-slate-900">Technician (Elena)</div>
              <div className="text-[11px] text-slate-500">tech@apexrepair.com</div>
              <div className="text-[11px] text-teal-600 font-mono mt-1">TechPass123!</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
              <div className="font-bold text-xs text-slate-900">Administrator</div>
              <div className="text-[11px] text-slate-500">admin@fixtrack.com</div>
              <div className="text-[11px] text-teal-600 font-mono mt-1">AdminPass123!</div>
            </div>
          </div>

          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all"
            >
              Sign In to Demo Portal <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
