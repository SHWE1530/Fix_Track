import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, Search, ArrowRight, Wrench, Shield, FileText } from 'lucide-react';
import api from '../../api/client';
import CategoryIcon, { CATEGORY_META } from '../../components/CategoryIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function MyAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    async function loadAssets() {
      setLoading(true);
      try {
        const query = categoryFilter ? `?category=${categoryFilter}` : '';
        const data = await api.get(`/assets${query}`);
        setAssets(data);
      } catch (err) {
        console.error('Failed to load assets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, [categoryFilter]);

  const filteredAssets = assets.filter((a) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      a.make?.toLowerCase().includes(term) ||
      a.model?.toLowerCase().includes(term) ||
      a.serial_number?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Registered Assets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered devices, appliances, bikes, and gear with portable Repair Passports
          </p>
        </div>
        <Link
          to="/customer/assets/new"
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Register New Asset
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by make, model, or serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        >
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <LoadingSpinner text="Loading your assets..." fullPage />
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No assets found"
          description="You haven't registered any items matching these criteria yet."
          actionLabel="Register an Asset"
          actionLink="/customer/assets/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-brand-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <CategoryIcon category={asset.category} size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{asset.make} {asset.model}</h3>
                      <div className="text-[11px] text-slate-400">
                        {asset.year ? `Year ${asset.year}` : 'Year unrecorded'}
                      </div>
                    </div>
                  </div>
                  <CategoryIcon category={asset.category} showLabel />
                </div>

                <div className="space-y-1 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                  <div className="flex justify-between">
                    <span>Serial No:</span>
                    <span className="font-semibold text-slate-700">{asset.serial_number || 'N/A'}</span>
                  </div>
                  {asset.color && (
                    <div className="flex justify-between">
                      <span>Color:</span>
                      <span className="text-slate-700 font-sans">{asset.color}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Lifetime Repairs:</span>
                    <span className="font-bold text-teal-700">{asset.total_repairs_count || 0}</span>
                  </div>
                </div>

                {asset.notes && (
                  <p className="text-xs text-slate-500 line-clamp-2 italic">
                    "{asset.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Link
                  to={`/customer/passports/${asset.id}`}
                  className="w-full py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Layers size={14} /> Open Repair Passport
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/customer/requests/new?asset_id=${asset.id}`}
                    className="flex-1 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <Wrench size={12} /> Book Repair
                  </Link>
                  <Link
                    to={`/customer/assets/${asset.id}`}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
