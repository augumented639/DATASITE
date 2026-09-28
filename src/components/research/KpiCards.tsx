import React from 'react';
import { TrendingUp, TrendingDown, Award, Calendar, Layers, ShieldCheck } from 'lucide-react';
import { StatisticalSummary, IndicatorDefinition } from '../../types/data';
import { formatDataValue } from '../../services/statistics';

interface KpiCardsProps {
  summary: StatisticalSummary | null;
  indicator: IndicatorDefinition;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary, indicator }) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const fmt = (val: number) => formatDataValue(val, indicator.formatType, indicator.unit);
  const isPositiveYoY = summary.yoyChangePercent !== null && summary.yoyChangePercent >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      
      {/* 1. Latest Value */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
        <span className="text-[11px] font-medium text-slate-400 block mb-1">
          Current Value ({summary.latestYear})
        </span>
        <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums tracking-tight">
          {fmt(summary.latestValue)}
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block truncate">
          {indicator.unit}
        </span>
      </div>

      {/* 2. YoY Change */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
        <span className="text-[11px] font-medium text-slate-400 block mb-1">
          Annual YoY Change
        </span>
        <div className="flex items-center gap-1.5">
          {summary.yoyChangePercent !== null ? (
            <>
              {isPositiveYoY ? (
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${isPositiveYoY ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositiveYoY ? '+' : ''}{summary.yoyChangePercent.toFixed(1)}%
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-slate-500 font-mono">N/A</span>
          )}
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block">
          vs {summary.previousYear} ({fmt(summary.previousValue)})
        </span>
      </div>

      {/* 3. 5-Year CAGR */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
        <span className="text-[11px] font-medium text-slate-400 block mb-1">
          5-Year CAGR
        </span>
        <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono tabular-nums">
          {summary.cagr !== null ? `${summary.cagr >= 0 ? '+' : ''}${summary.cagr.toFixed(2)}%` : 'N/A'}
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block">
          Compound Growth
        </span>
      </div>

      {/* 4. Peak Recorded */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
        <span className="text-[11px] font-medium text-slate-400 block mb-1">
          Peak Recorded ({summary.highestValue.year})
        </span>
        <div className="text-xl sm:text-2xl font-bold text-amber-300 font-mono tabular-nums">
          {fmt(summary.highestValue.value)}
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block">
          All-time Series High
        </span>
      </div>

      {/* 5. Trough / Lowest */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
        <span className="text-[11px] font-medium text-slate-400 block mb-1">
          Lowest Value ({summary.lowestValue.year})
        </span>
        <div className="text-xl sm:text-2xl font-bold text-slate-300 font-mono tabular-nums">
          {fmt(summary.lowestValue.value)}
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block">
          Series Baseline
        </span>
      </div>

      {/* 6. Coverage & Completeness */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
        <span className="text-[11px] font-medium text-slate-400 block mb-1">
          Series Coverage
        </span>
        <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
          {summary.dataCoverage.validObservations} yrs
        </div>
        <span className="text-[10px] text-emerald-400 mt-1 block font-medium">
          {summary.dataCoverage.startYear} – {summary.dataCoverage.endYear}
        </span>
      </div>

    </div>
  );
};
