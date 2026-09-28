import React from 'react';
import { ArrowUpRight, TrendingUp, BarChart2, ShieldCheck, Cpu, DollarSign, Users, Zap, Globe, Activity } from 'lucide-react';
import { POPULAR_INDICATORS } from '../../services/indicatorCatalog';
import { IndicatorDefinition } from '../../types/data';

interface FeaturedTopicsGridProps {
  selectedCategory: string;
  onSelectIndicator: (indicatorId: string, countryCode: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Technology & AI': <Cpu className="w-4 h-4 text-cyan-400" />,
  'Macroeconomics & GDP': <DollarSign className="w-4 h-4 text-emerald-400" />,
  'Demographics & Population': <Users className="w-4 h-4 text-purple-400" />,
  'Digital Economy & Internet': <Globe className="w-4 h-4 text-blue-400" />,
  'Energy & Environment': <Zap className="w-4 h-4 text-amber-400" />,
  'Healthcare & Society': <Activity className="w-4 h-4 text-rose-400" />,
  'Trade & Industry': <BarChart2 className="w-4 h-4 text-indigo-400" />,
  'Education & Labor': <ShieldCheck className="w-4 h-4 text-teal-400" />,
};

export const FeaturedTopicsGrid: React.FC<FeaturedTopicsGridProps> = ({
  selectedCategory,
  onSelectIndicator,
}) => {
  const filtered = POPULAR_INDICATORS.filter(ind => {
    if (!selectedCategory || selectedCategory === 'All') return true;
    return ind.category === selectedCategory;
  });

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {selectedCategory === 'All' ? 'Curated Market Datasets & Indicators' : `${selectedCategory} Datasets`}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Normalized public data indicators directly queried from the World Bank API.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Showing {filtered.length} public indicators
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((indicator) => {
          const icon = CATEGORY_ICONS[indicator.category] || <BarChart2 className="w-4 h-4 text-cyan-400" />;

          return (
            <div
              key={indicator.id}
              className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 group"
            >
              <div>
                {/* Clean unboxed category header */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    {icon}
                    <span className="font-medium">{indicator.category}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">{indicator.id}</span>
                </div>

                <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors mb-2 line-clamp-2">
                  {indicator.name}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {indicator.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 mt-auto">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                  <div>
                    <span className="text-slate-400 font-medium">Unit:</span> {indicator.unit}
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Source:</span> {indicator.provider}
                  </div>
                </div>

                <button
                  onClick={() => onSelectIndicator(indicator.id, indicator.defaultCountryCode)}
                  className="w-full py-2 px-3 bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View Analysis</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
