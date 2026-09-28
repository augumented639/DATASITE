import React from 'react';
import { RefreshCw, Bookmark, BookmarkCheck, Share2, FileDown, Globe, Calendar, Database, ShieldCheck, ChevronDown } from 'lucide-react';
import { IndicatorDefinition, StatisticalSummary, CountryInfo } from '../../types/data';
import { MAJOR_COUNTRIES } from '../../services/countryCatalog';

interface ReportHeaderProps {
  indicator: IndicatorDefinition;
  country: CountryInfo;
  summary: StatisticalSummary | null;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onSelectCountry: (countryCode: string) => void;
  onExportReport: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  indicator,
  country,
  summary,
  isBookmarked,
  onToggleBookmark,
  onRefresh,
  isLoading,
  onSelectCountry,
  onExportReport,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
      
      {/* Top action & status row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        
        {/* Anti-slop clean metadata breadcrumb / kicker */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="text-cyan-400 font-semibold">{indicator.category}</span>
          <span aria-hidden="true">·</span>
          <span>Indicator ID: <code className="font-mono text-slate-300">{indicator.id}</code></span>
          <span aria-hidden="true">·</span>
          <span>Source: {indicator.source.split(',')[0]}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Country Switcher */}
          <div className="relative">
            <select
              value={country.code}
              onChange={(e) => onSelectCountry(e.target.value)}
              className="appearance-none bg-slate-950 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-white py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {MAJOR_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh Data button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh from public API"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Save/Bookmark */}
          <button
            onClick={onToggleBookmark}
            className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-cyan-950 border-cyan-700 text-cyan-400'
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title={isBookmarked ? 'Saved to Workspace' : 'Save to Workspace'}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* Export button */}
          <button
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Main Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 text-balance">
        {indicator.name} — <span className="text-cyan-400">{country.name}</span>
      </h1>

      {/* Summary Description */}
      <p className="text-sm text-slate-300 leading-relaxed max-w-4xl mb-6">
        {indicator.description}
      </p>

      {/* Data Coverage & Freshness Pills (Structured clean grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 text-xs">
        <div>
          <span className="text-slate-500 block">Primary Source</span>
          <span className="font-semibold text-slate-200">{indicator.provider} API v2</span>
        </div>
        <div>
          <span className="text-slate-500 block">Data Coverage Span</span>
          <span className="font-semibold text-slate-200 font-mono">
            {summary ? `${summary.dataCoverage.startYear} – ${summary.dataCoverage.endYear}` : 'Loading...'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Observations</span>
          <span className="font-semibold text-slate-200 font-mono">
            {summary ? `${summary.dataCoverage.validObservations} Annual Data Points` : 'Analyzing...'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Data Retrieved</span>
          <span className="font-semibold text-slate-200 font-mono">
            {summary?.retrievedAt ? new Date(summary.retrievedAt).toLocaleDateString() : new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

    </div>
  );
};
