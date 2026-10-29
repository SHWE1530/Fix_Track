import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Check, X, Mail, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function StaffManagementPage() {
  const [business, setBusiness] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('technician'); // technician or owner
  const [invitePassword, setInvitePassword] = useState('StaffPass123!');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadStaffData = async () => {
    try {
      const biz = await api.get('/businesses/my');
      setBusiness(biz);
      if (biz) {
        const staffList = await api.get(`/businesses/${biz.id}/staff`);
        setStaff(staffList);
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  const handleInviteStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/businesses/${business.id}/staff`, {
        email: inviteEmail.trim(),
        full_name: inviteName.trim(),
        role: inviteRole,
        password: invitePassword,
      });
      setInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      await loadStaffData();
    } catch (err) {
      setError(err.message || 'Failed to add staff member');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading staff directory..." fullPage />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Staff Memberships & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage technician accounts, assigned roles, and shop access privileges
          </p>
        </div>
        <button
          onClick={() => {
            setError('');
            setInviteModal(true);
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
        >
          <UserPlus size={14} /> Add Staff Member
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Active Staff Members ({staff.length})</h3>

        <div className="divide-y divide-slate-100 text-xs">
          {staff.map((m) => (
            <div key={m.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 font-bold text-slate-800 flex items-center justify-center">
                  {m.user_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{m.user_name}</div>
                  <div className="text-[11px] text-slate-400">{m.user_email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  m.role === 'owner' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-teal-50 text-teal-800 border border-teal-200'
                }`}>
                  {m.role}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal isOpen={inviteModal} onClose={() => setInviteModal(false)} title="Add Shop Staff Member">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs mb-3 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <form onSubmit={handleInviteStaff} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Elena Rostova"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Email Address *</label>
            <input
              type="email"
              required
              placeholder="technician@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Staff Role *</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            >
              <option value="technician">Technician (Diagnosis, Estimates, Repairs)</option>
              <option value="owner">Co-Owner (Full Business Administration)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Initial Password</label>
            <input
              type="text"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setInviteModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl">
              {submitting ? 'Adding...' : 'Grant Membership'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
