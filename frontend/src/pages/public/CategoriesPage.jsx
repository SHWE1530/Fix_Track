import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Laptop, Home, Bike, Car, Armchair, Box, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  {
    key: 'smartphones_tablets',
    title: 'Smartphones & Tablets',
    icon: Smartphone,
    desc: 'Screen replacement, battery renewal, charge port soldering, camera modules, and water damage remediation.',
    metadataExamples: ['Storage capacity (GB)', 'Battery health cycle count', 'Carrier lock status', 'Screen glass condition'],
    color: 'border-sky-200 bg-sky-50 text-sky-600',
  },
  {
    key: 'laptops_computers',
    title: 'Laptops & Computers',
    icon: Laptop,
    desc: 'Thermal paste repasting, motherboard component diagnostics, keyboard repair, SSD upgrades, and display hinges.',
    metadataExamples: ['RAM configuration', 'CPU model', 'Operating system', 'BIOS firmware revision'],
    color: 'border-indigo-200 bg-indigo-50 text-indigo-600',
  },
  {
    key: 'home_appliances',
    title: 'Home Appliances',
    icon: Home,
    desc: 'Washing machines, dishwashers, dryers, refrigerators, espresso machines, and vacuum cleaner motors.',
    metadataExamples: ['Voltage & wattage', 'Capacity (kg / liters)', 'Installation type', 'Error diagnostic codes'],
    color: 'border-amber-200 bg-amber-50 text-amber-600',
  },
  {
    key: 'bicycles',
    title: 'Bicycles & E-Bikes',
    icon: Bike,
    desc: 'Hydraulic brake bleeding, gear derailleur indexing, wheel truing, bottom bracket overhaul, and e-bike motor wiring.',
    metadataExamples: ['Frame material & size', 'Wheel diameter (inches)', 'Brake system type', 'Motor wattage'],
    color: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  },
  {
    key: 'cars_motorcycles',
    title: 'Cars & Motorcycles',
    icon: Car,
    desc: 'Brake pads, alternator overhaul, diagnostic OBD-II fault clearing, suspension bushings, and exhaust repairs.',
    metadataExamples: ['VIN number', 'Engine displacement (cc)', 'Mileage / Odometer', 'Fuel & transmission type'],
    color: 'border-red-200 bg-red-50 text-red-600',
  },
  {
    key: 'furniture',
    title: 'Furniture & Restoration',
    icon: Armchair,
    desc: 'Wood joinery re-gluing, upholstery reupholstering, antique finish restoration, and reclining mechanism repair.',
    metadataExamples: ['Wood species', 'Fabric / leather type', 'Dimensions (cm)', 'Original artisan markings'],
    color: 'border-orange-200 bg-orange-50 text-orange-600',
  },
  {
    key: 'other',
    title: 'Other Repairable Items',
    icon: Box,
    desc: 'Musical instruments, power tools, lawnmowers, audio synthesizers, and vintage mechanical gear.',
    metadataExamples: ['Serial tag', 'Power source', 'Custom attributes'],
    color: 'border-slate-200 bg-slate-50 text-slate-600',
  },
];

export default function CategoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          Configurable Category Architecture
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Supported Repair Categories
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          FixTrack uses a flexible category system. Rather than rigid hardcoded schemas, all assets share common item attributes (make, model, year, serial identifier) with dynamic category-specific metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.key}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-brand-500/50 transition-colors"
            >
              <div className="space-y-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${cat.color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{cat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{cat.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customizable Metadata Fields:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cat.metadataExamples.map((ex, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[11px]"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={`/directory?category=${cat.key}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                >
                  Find {cat.title} Specialists <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
