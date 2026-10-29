import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Bell,
  User,
  LogOut,
  Shield,
  Layers,
  Store,
  FileText,
  Clock,
  Menu,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Wrench size={20} className="rotate-45" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                  Fix<span className="text-brand-600">Track</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                  Transparency
                </span>
              </div>
            </Link>

            {/* Public Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link to="/how-it-works" className="hover:text-brand-600 transition-colors">
                How it Works
              </Link>
              <Link to="/categories" className="hover:text-brand-600 transition-colors">
                Categories
              </Link>
              <Link to="/directory" className="hover:text-brand-600 transition-colors">
                Repair Directory
              </Link>
            </nav>
          </div>

          {/* Right Action Center */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Role Specific Shortcuts */}
                <div className="hidden lg:flex items-center gap-1.5 mr-2">
                  {user.role === 'customer' && (
                    <>
                      <Link
                        to="/customer/dashboard"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        My Repairs
                      </Link>
                      <Link
                        to="/customer/assets"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        My Assets
                      </Link>
                    </>
                  )}

                  {(user.role === 'business_owner' || user.role === 'technician') && (
                    <Link
                      to="/business/dashboard"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors flex items-center gap-1.5"
                    >
                      <Store size={14} /> Shop Dashboard
                    </Link>
                  )}

                  {user.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 transition-colors flex items-center gap-1.5"
                    >
                      <Shield size={14} /> Admin Portal
                    </Link>
                  )}
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
                    }}
                    className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                        <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                          Notifications ({unreadCount} new)
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                          >
                            <Check size={14} /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications at this time
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link_url) {
                                  navigate(n.link_url);
                                  setShowNotifications(false);
                                }
                              }}
                              className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                                !n.is_read ? 'bg-teal-50/50 font-medium' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-800">{n.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(n.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-600 leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden sm:block text-left text-xs leading-tight">
                      <div className="font-semibold text-slate-800">{user.full_name}</div>
                      <div className="text-[10px] uppercase font-bold text-brand-600">
                        {user.role.replace('_', ' ')}
                      </div>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="font-semibold text-xs text-slate-900">{user.full_name}</div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      </div>

                      {user.role === 'customer' && (
                        <div className="py-1 border-b border-slate-100 text-xs">
                          <Link
                            to="/customer/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            Customer Dashboard
                          </Link>
                          <Link
                            to="/customer/assets"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            My Registered Assets
                          </Link>
                          <Link
                            to="/customer/warranties"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            My Warranties
                          </Link>
                          <Link
                            to="/customer/sharing"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            Repair Passport Sharing
                          </Link>
                        </div>
                      )}

                      {(user.role === 'business_owner' || user.role === 'technician') && (
                        <div className="py-1 border-b border-slate-100 text-xs">
                          <Link
                            to="/business/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            Shop Dashboard
                          </Link>
                          <Link
                            to="/business/jobs"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            Repair Jobs & Intake
                          </Link>
                          {user.role === 'business_owner' && (
                            <>
                              <Link
                                to="/business/staff"
                                onClick={() => setShowUserMenu(false)}
                                className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                              >
                                Staff Memberships
                              </Link>
                              <Link
                                to="/business/profile"
                                onClick={() => setShowUserMenu(false)}
                                className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                              >
                                Business Settings
                              </Link>
                            </>
                          )}
                        </div>
                      )}

                      {user.role === 'admin' && (
                        <div className="py-1 border-b border-slate-100 text-xs">
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            Admin Verification Center
                          </Link>
                          <Link
                            to="/admin/audit"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                          >
                            Platform Audit Logs
                          </Link>
                        </div>
                      )}

                      <div className="py-1 text-xs">
                        <Link
                          to="/customer/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
                        >
                          Account Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                        >
                          <LogOut size={14} /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm shadow-brand-500/20 transition-all hover:shadow"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            How it Works
          </Link>
          <Link
            to="/categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Categories
          </Link>
          <Link
            to="/directory"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Repair Directory
          </Link>
        </div>
      )}
    </header>
  );
}
