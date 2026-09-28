import React from 'react';
import { Bookmark, Trash2, ArrowUpRight, Clock, Globe, BarChart2 } from 'lucide-react';
import { POPULAR_INDICATORS } from '../../services/indicatorCatalog';
import { MAJOR_COUNTRIES } from '../../services/countryCatalog';

interface WorkspaceViewProps {
  savedItems: { indicatorId: string; countryCode: string; addedAt: string }[];
  recentSearches: { query: string; indicatorId: string; countryCode: string; timestamp: string }[];
  onRemoveBookmark: (indicatorId: string, countryCode: string) => void;
  onClearRecentSearches: () => void;
  onOpenAnalysis: (indicatorId: string, countryCode: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  savedItems,
  recentSearches,
  onRemoveBookmark,
  onClearRecentSearches,
  onOpenAnalysis,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2 uppercase">
          <Bookmark className="w-3.5 h-3.5" />
          <span>Personal Analyst Workspace</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Saved Indicators & Search History
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Quickly access your pinned market indicators, custom watchlists, and recently inspected datasets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Saved Indicators (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-cyan-400" />
              <span>Pinned Indicators ({savedItems.length})</span>
            </h2>
          </div>

          {savedItems.length === 0 ? (
            <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center">
              <p className="text-sm text-slate-400 mb-3">
                No pinned indicators yet. Click the bookmark icon on any research analysis page to save datasets here.
              </p>
              <button
                onClick={() => onOpenAnalysis('NY.GDP.MKTP.CD', 'WLD')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Explore World GDP Dataset
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedItems.map((item) => {
                const indicator = POPULAR_INDICATORS.find(i => i.id === item.indicatorId) || {
                  id: item.indicatorId,
                  name: item.indicatorId,
                  category: 'Macroeconomics',
                  unit: 'Standard',
                  source: 'World Bank',
                };
                const country = MAJOR_COUNTRIES.find(c => c.code === item.countryCode) || {
                  name: item.countryCode,
                  code: item.countryCode,
                };

                return (
                  <div
                    key={`${item.indicatorId}-${item.countryCode}`}
                    className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-4 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-cyan-400">{country.name}</span>
                        <span>·</span>
                        <span>{indicator.category}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-500">{indicator.id}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {indicator.name}
                      </h3>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        Pinned on {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onOpenAnalysis(item.indicatorId, item.countryCode)}
                        className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Analyze</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onRemoveBookmark(item.indicatorId, item.countryCode)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Remove from Workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Search History (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Recent Activity</span>
            </h2>
            {recentSearches.length > 0 && (
              <button
                onClick={onClearRecentSearches}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 divide-y divide-slate-800/60">
            {recentSearches.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 italic">
                No recent searches.
              </div>
            ) : (
              recentSearches.map((rec, i) => (
                <button
                  key={i}
                  onClick={() => onOpenAnalysis(rec.indicatorId, rec.countryCode)}
                  className="w-full py-2.5 px-1 flex items-center justify-between text-left hover:bg-slate-800/40 rounded transition-colors group cursor-pointer"
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-medium text-slate-300 group-hover:text-cyan-400 transition-colors block truncate">
                      {rec.query}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {rec.countryCode} · {rec.indicatorId}
                    </span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
