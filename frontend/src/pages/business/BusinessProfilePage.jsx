import React, { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Globe, Check, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { CATEGORY_META } from '../../components/CategoryIcon';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function BusinessProfilePage() {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [supportedCategories, setSupportedCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBusiness() {
      try {
        const data = await api.get('/businesses/my');
        if (data) {
          setBusiness(data);
          setName(data.name || '');
          setLegalName(data.legal_name || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setWebsite(data.website || '');
          setDescription(data.description || '');
          setSupportedCategories(data.supported_categories || []);
        }
      } catch (err) {
        console.error('Failed to load business profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBusiness();
  }, []);

  const toggleCategory = (key) => {
    if (supportedCategories.includes(key)) {
      setSupportedCategories(supportedCategories.filter((k) => k !== key));
    } else {
      setSupportedCategories([...supportedCategories, key]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      if (!name.trim() || !phone.trim() || !address.trim()) {
        throw new Error('Name, phone, and address are required');
      }
      if (supportedCategories.length === 0) {
        throw new Error('Please select at least one serviced category');
      }

      if (business) {
        const updated = await api.put(`/businesses/${business.id}`, {
          name,
          legal_name: legalName,
          phone,
          address,
          website,
          description,
          supported_categories: supportedCategories,
        });
        setBusiness(updated);
      } else {
        const created = await api.post('/businesses', {
          name,
          legal_name: legalName,
          email: 'service@apexrepair.com',
          phone,
          address,
          website,
          description,
          supported_categories: supportedCategories,
        });
        setBusiness(created);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading business settings..." fullPage />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Repair Business Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure workshop address, serviced categories, and public directory visibility
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check size={16} className="text-emerald-600 flex-shrink-0" />
          Business settings saved successfully.
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Workshop / Brand Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Legal Company Name</label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Service Phone Number *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Official Website URL</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700">Physical Workshop Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700">Shop Description & Specialization</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs resize-none"
            />
          </div>
        </div>

        {/* Supported Categories Selector */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-800">Supported Service Categories *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const isChecked = supportedCategories.includes(key);
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCategory(key)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs font-semibold transition-all ${
                    isChecked
                      ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-1 ring-brand-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} />
                    <span>{meta.label}</span>
                  </div>
                  {isChecked && <Check size={14} className="text-brand-600" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Business Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
