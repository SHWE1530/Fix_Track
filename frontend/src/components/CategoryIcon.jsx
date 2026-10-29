import React from 'react';
import { Smartphone, Laptop, Home, Bike, Car, Armchair, Box } from 'lucide-react';

export const CATEGORY_META = {
  smartphones_tablets: { label: 'Smartphones & Tablets', icon: Smartphone, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  laptops_computers: { label: 'Laptops & Computers', icon: Laptop, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  home_appliances: { label: 'Home Appliances', icon: Home, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  bicycles: { label: 'Bicycles', icon: Bike, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  cars_motorcycles: { label: 'Cars & Motorcycles', icon: Car, color: 'text-red-600 bg-red-50 border-red-200' },
  furniture: { label: 'Furniture', icon: Armchair, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  other: { label: 'Other Items', icon: Box, color: 'text-slate-600 bg-slate-50 border-slate-200' },
};

export default function CategoryIcon({ category, size = 18, showLabel = false, className = '' }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const Icon = meta.icon;

  if (showLabel) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${meta.color} ${className}`}>
        <Icon size={size} />
        {meta.label}
      </span>
    );
  }

  return <Icon size={size} className={className} />;
}
