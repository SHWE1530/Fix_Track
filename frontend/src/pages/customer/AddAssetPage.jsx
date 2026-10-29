import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, ArrowLeft, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import api from '../../api/client';
import { CATEGORY_META } from '../../components/CategoryIcon';

export default function AddAssetPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('smartphones_tablets');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [metadataRows, setMetadataRows] = useState([
    { key: 'storage_gb', value: '256' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMetadataRow = () => {
    setMetadataRows([...metadataRows, { key: '', value: '' }]);
  };

  const removeMetadataRow = (index) => {
    setMetadataRows(metadataRows.filter((_, i) => i !== index));
  };

  const updateMetadataRow = (index, field, value) => {
    const updated = [...metadataRows];
    updated[index][field] = value;
    setMetadataRows(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!make.trim() || !model.trim()) {
      setError('Make and model are required');
      return;
    }

    setLoading(true);
    try {
      const metadata = {};
      metadataRows.forEach((row) => {
        if (row.key.trim()) {
          metadata[row.key.trim()] = row.value.trim();
        }
      });

      const payload = {
        category,
        make: make.trim(),
        model: model.trim(),
        year: year ? parseInt(year, 10) : null,
        serial_number: serialNumber.trim() || null,
        color: color.trim() || null,
        notes: notes.trim() || null,
        metadata,
      };

      const newAsset = await api.post('/assets', payload);
      navigate(`/customer/assets`);
    } catch (err) {
      setError(err.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          to="/customer/assets"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft size={14} /> Back to My Assets
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Register New Asset</h1>
        <p className="text-xs text-slate-500 mt-1">
          Add an item to generate its permanent digital Repair Passport and enable transparent servicing
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const isSelected = category === key;
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-bold ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <Icon size={18} className={isSelected ? 'text-brand-600' : 'text-slate-400'} />
                  <span className="text-xs">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Core Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Make / Brand *</label>
            <input
              type="text"
              required
              placeholder="e.g. Apple, Dell, Bosch, Trek, Honda"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Model Name / Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. iPhone 15 Pro, ThinkPad X1, Serie 6"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Manufacturing Year (Optional)</label>
            <input
              type="number"
              placeholder="e.g. 2023"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Serial Number / VIN / IMEI</label>
            <input
              type="text"
              placeholder="Serial identifier (if available)"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700">Color / Finish</label>
            <input
              type="text"
              placeholder="e.g. Natural Titanium, Deep Black, Gloss White"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Dynamic Category Specific Metadata */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">Category-Specific Metadata</span>
              <p className="text-[11px] text-slate-400">Add technical specs, firmware, storage, or custom parameters</p>
            </div>
            <button
              type="button"
              onClick={addMetadataRow}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus size={12} /> Add Attribute
            </button>
          </div>

          <div className="space-y-2">
            {metadataRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. ram_gb, battery_health)"
                  value={row.key}
                  onChange={(e) => updateMetadataRow(i, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 32GB, 92%)"
                  value={row.value}
                  onChange={(e) => updateMetadataRow(i, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => removeMetadataRow(i)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1 pt-2">
          <label className="text-xs font-semibold text-slate-700">Owner Notes</label>
          <textarea
            rows={3}
            placeholder="Add purchase provenance, special modifications, or baseline condition notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to="/customer/assets"
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check size={14} /> {loading ? 'Registering...' : 'Save & Register Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
