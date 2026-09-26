import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  colorVariant?: 'gold' | 'emerald' | 'amber' | 'blue';
}

export function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  colorVariant = 'gold',
}: MetricCardProps) {
  const colorMap = {
    gold: {
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/40',
      iconColor: 'text-amber-300',
      glow: 'hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      valColor: 'text-white',
    },
    emerald: {
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/40',
      iconColor: 'text-emerald-300',
      glow: 'hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]',
      valColor: 'text-white',
    },
    amber: {
      bg: 'bg-orange-500/15',
      border: 'border-orange-500/40',
      iconColor: 'text-orange-300',
      glow: 'hover:border-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]',
      valColor: 'text-white',
    },
    blue: {
      bg: 'bg-sky-500/15',
      border: 'border-sky-500/40',
      iconColor: 'text-sky-300',
      glow: 'hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]',
      valColor: 'text-white',
    },
  }[colorVariant];

  return (
    <div
      className={`card p-5 group transition-all duration-300 hover:-translate-y-1 bg-gradient-to-b from-[#181818] to-[#121212] border-[#2e2e2e] ${colorMap.glow}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
          {label}
        </span>
        <div
          className={`w-10 h-10 rounded-xl ${colorMap.bg} border ${colorMap.border} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm`}
        >
          <Icon className={`w-5 h-5 ${colorMap.iconColor}`} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight ${colorMap.valColor}`}>{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
