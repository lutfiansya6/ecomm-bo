'use client';

import React, { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, BarChart3, LineChart, Sparkles, ArrowUpRight } from 'lucide-react';

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

const mockMonthlyData: MonthlyData[] = [
  { month: 'Apr', revenue: 14500000, orders: 4 },
  { month: 'Mei', revenue: 19800000, orders: 6 },
  { month: 'Jun', revenue: 24200000, orders: 7 },
  { month: 'Jul', revenue: 18900000, orders: 5 },
  { month: 'Agu', revenue: 28500000, orders: 9 },
  { month: 'Sep', revenue: 39580000, orders: 12 },
];

export function SalesChart() {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxRevenue = 45000000; // 45 Jt ceiling for neat 10Jt increments
  const totalRevenue = mockMonthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = Math.round(totalRevenue / mockMonthlyData.length);
  const lastGrowth = Math.round(
    ((mockMonthlyData[5].revenue - mockMonthlyData[4].revenue) / mockMonthlyData[4].revenue) * 100
  );

  // Grid steps (40jt, 30jt, 20jt, 10jt, 0)
  const gridSteps = [40000000, 30000000, 20000000, 10000000, 0];

  // For Area Chart SVG calculations
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 20;
  const usableWidth = svgWidth - paddingX * 2;
  const usableHeight = svgHeight - paddingY * 2;

  const points = mockMonthlyData.map((d, i) => {
    const x = paddingX + (i / (mockMonthlyData.length - 1)) * usableWidth;
    const y = paddingY + usableHeight - (d.revenue / maxRevenue) * usableHeight;
    return { x, y, ...d };
  });

  // Generate smooth SVG curve path using cubic Bezier
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingY + usableHeight} L ${points[0].x} ${paddingY + usableHeight} Z`;

  return (
    <div className="card p-6 bg-gradient-to-b from-[#141414] to-[#101010] border-[#2e2e2e] shadow-xl">
      {/* Header with Title, Controls & Highlights */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#262626]">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-semibold text-white tracking-wide">
              Tren Pendapatan & Penjualan
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <ArrowUpRight className="w-3 h-3" />
              +{lastGrowth}% MoM
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Total omset 6 bulan: <span className="text-amber-300 font-bold font-mono">{formatPrice(totalRevenue)}</span> • Rata-rata: <span className="text-gray-200 font-medium font-mono">{formatPrice(avgRevenue)}/bln</span>
          </p>
        </div>

        {/* Chart Style Switcher (Bar vs Line/Area) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-[#1a1a1a] border border-[#333333]">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartType === 'bar'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Diagram Bar</span>
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartType === 'area'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Kurva Area</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-between pt-4 pb-2 text-xs">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-amber-500 via-yellow-400 to-yellow-200 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
            <span className="font-semibold text-amber-300">Pendapatan Bruto (IDR)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
            <span className="text-cyan-300 font-medium">Volume Pesanan</span>
          </div>
        </div>
        <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
          Skala Maksimal: Rp 45 Juta
        </span>
      </div>

      {/* Main Visual Chart Container */}
      <div className="relative mt-2 select-none">
        {/* Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-2 z-30 px-3.5 py-2 rounded-xl bg-[#1e1e1e] border-2 border-yellow-400 text-xs shadow-2xl pointer-events-none transform -translate-x-1/2 transition-all animate-fadeIn"
            style={{
              left: `${((hoveredIdx + 0.5) / mockMonthlyData.length) * 100}%`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
              <span className="text-gray-300 font-bold uppercase text-[10px]">
                {mockMonthlyData[hoveredIdx].month} 2026
              </span>
            </div>
            <p className="font-bold text-yellow-300 text-sm font-mono leading-tight">
              {formatPrice(mockMonthlyData[hoveredIdx].revenue)}
            </p>
            <p className="text-cyan-300 font-medium text-[11px] mt-0.5 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              {mockMonthlyData[hoveredIdx].orders} Pesanan Sukses
            </p>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* OPTION 1: BRIGHT ILLUMINATED BAR CHART */}
        {/* ---------------------------------------------------- */}
        {chartType === 'bar' && (
          <div className="relative pt-6">
            {/* Horizontal Gridlines with Labels */}
            <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none">
              {gridSteps.map((val) => (
                <div key={val} className="w-full flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-500 w-12 text-right shrink-0">
                    {val === 0 ? '0' : `${val / 1000000}Jt`}
                  </span>
                  <div className="flex-1 border-b border-[#262626] border-dashed" />
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="h-[220px] flex items-end justify-between gap-3 sm:gap-6 pl-14 pr-2 pb-8">
              {mockMonthlyData.map((item, idx) => {
                const heightPct = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative z-10"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Top Value Tag */}
                    <div
                      className={`mb-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all duration-200 ${
                        isHovered
                          ? 'bg-yellow-400 text-black scale-110 shadow-[0_0_10px_rgba(250,204,21,0.6)]'
                          : 'text-amber-200/90 bg-[#221c10] border border-amber-500/30'
                      }`}
                    >
                      {(item.revenue / 1000000).toFixed(1)}Jt
                    </div>

                    {/* The Bar with Bright Glowing Gradient */}
                    <div className="w-full max-w-[52px] h-[170px] flex items-end justify-center">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 relative overflow-hidden ${
                          isHovered
                            ? 'bg-gradient-to-t from-amber-600 via-yellow-400 to-yellow-200 shadow-[0_0_25px_rgba(250,204,21,0.6)] scale-x-105'
                            : 'bg-gradient-to-t from-amber-700 via-amber-500 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      >
                        {/* Shimmer overlay inside bar */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60 pointer-events-none" />

                        {/* Top luminous cap */}
                        <div className="w-full h-1.5 bg-yellow-100/90 shadow-[0_0_8px_#ffffff]" />
                      </div>
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-xs mt-3 font-semibold transition-colors ${
                        isHovered ? 'text-yellow-300 font-bold scale-110' : 'text-gray-300'
                      }`}
                    >
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* OPTION 2: SMOOTH AREA & GLOWING CURVE CHART */}
        {/* ---------------------------------------------------- */}
        {chartType === 'area' && (
          <div className="relative pt-4 pb-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-[220px] overflow-visible"
            >
              <defs>
                {/* Radiant Golden Glow Gradient */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
                </linearGradient>

                {/* Line Gradient */}
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal Gridlines */}
              {gridSteps.map((val) => {
                const y = paddingY + usableHeight - (val / maxRevenue) * usableHeight;
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#2a2a2a"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="#777777"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val === 0 ? '0' : `${val / 1000000}Jt`}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              <path d={areaPath} fill="url(#areaGradient)" />

              {/* Bright Glowing Line */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#goldGlow)"
              />

              {/* Data Points */}
              {points.map((pt, idx) => {
                const isHovered = hoveredIdx === idx;
                return (
                  <g
                    key={pt.month}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Outer pulse circle when hovered */}
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill="#facc15"
                        fillOpacity="0.25"
                        className="animate-pulse"
                      />
                    )}

                    {/* Main circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? '7' : '5'}
                      fill="#fef08a"
                      stroke="#b45309"
                      strokeWidth="2.5"
                      className="transition-all duration-200"
                    />

                    {/* Month Label on X Axis */}
                    <text
                      x={pt.x}
                      y={svgHeight - 4}
                      fill={isHovered ? '#fde047' : '#aaaaaa'}
                      fontSize={isHovered ? '12' : '11'}
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {pt.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
