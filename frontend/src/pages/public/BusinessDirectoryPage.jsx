import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Store,
  Search,
  CheckCircle2,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import api from '../../api/client';
import CategoryIcon, { CATEGORY_META } from '../../components/CategoryIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function BusinessDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    async function loadDirectory() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedCategory) query.append('category', selectedCategory);
        if (search) query.append('search', search);

        const data = await api.get(`/businesses/directory?${query.toString()}`);
        setBusinesses(data);
      } catch (err) {
        console.error('Failed to load business directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDirectory();
  }, [selectedCategory, search]);

  const handleCategoryClick = (catKey) => {
    const next = selectedCategory === catKey ? '' : catKey;
    setSelectedCategory(next);
    if (next) searchParams.set('category', next);
    else searchParams.delete('category');
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          Verified Repair Network
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Repair Business Directory
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Find independent repair shops certified on the FixTrack transparency standard. Receive itemized immutable estimates and lifetime digital Repair Passports.
        </p>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="space-y-4">
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by shop name, specialty, address, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={() => handleCategoryClick('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedCategory === ''
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => handleCategoryClick(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CategoryIcon category={key} size={14} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Cards */}
      {loading ? (
        <LoadingSpinner text="Searching verified repair directory..." fullPage />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No repair businesses matched your filters"
          description="Try broadening your search term or clearing category filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedCategory('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => (
            <div
              key={biz.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-brand-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Store size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{biz.name}</h3>
                      {biz.legal_name && (
                        <div className="text-[11px] text-slate-400">{biz.legal_name}</div>
                      )}
                    </div>
                  </div>
                  {biz.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  )}
                </div>

                {biz.description && (
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {biz.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{biz.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400 flex-shrink-0" />
                    <span>{biz.phone}</span>
                  </div>
                  {biz.website && (
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-slate-400 flex-shrink-0" />
                      <a
                        href={biz.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline truncate inline-flex items-center gap-1"
                      >
                        {biz.website} <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Supported Categories Badges & Action */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Serviced Categories:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {biz.supported_categories.map((catKey) => (
                      <CategoryIcon key={catKey} category={catKey} showLabel />
                    ))}
                  </div>
                </div>

                <Link
                  to={`/customer/requests/new?business_id=${biz.id}`}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  Request Repair from this Shop <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
