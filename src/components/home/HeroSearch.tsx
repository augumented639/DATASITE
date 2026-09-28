import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, TrendingUp, Globe2, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { POPULAR_INDICATORS, searchIndicators } from '../../services/indicatorCatalog';
import { MAJOR_COUNTRIES } from '../../services/countryCatalog';
import { dataProviderRegistry } from '../../services/providers/ProviderRegistry';
import { IndicatorDefinition, DataCategory } from '../../types/data';

interface HeroSearchProps {
  onSelectSearch: (indicatorId: string, countryCode: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

const POPULAR_PROMPTS = [
  { label: 'India GDP', query: 'India GDP', indicatorId: 'NY.GDP.MKTP.CD', countryCode: 'IND' },
  { label: 'Global Population', query: 'Global Population', indicatorId: 'SP.POP.TOTL', countryCode: 'WLD' },
  { label: 'Internet Users', query: 'Internet Users', indicatorId: 'IT.NET.USER.ZS', countryCode: 'WLD' },
  { label: 'Renewable Energy', query: 'Renewable Energy', indicatorId: 'EG.ELC.RNEW.ZS', countryCode: 'WLD' },
  { label: 'Digital Economy', query: 'ICT Service Exports', indicatorId: 'BX.GSR.CCIS.ZS', countryCode: 'IND' },
  { label: 'AI & Cloud Infrastructure', query: 'Secure Internet Servers', indicatorId: 'IT.NET.SECR.P6', countryCode: 'USA' },
  { label: 'Inflation (CPI)', query: 'Inflation Consumer Prices', indicatorId: 'FP.CPI.TOTL.ZG', countryCode: 'USA' },
  { label: 'High-Tech Exports', query: 'High-Technology Exports', indicatorId: 'TX.VAL.TECH.MF.ZS', countryCode: 'CHN' },
];

const CATEGORIES: (DataCategory | 'All')[] = [
  'All',
  'Technology & AI',
  'Macroeconomics & GDP',
  'Digital Economy & Internet',
  'Energy & Environment',
  'Demographics & Population',
  'Trade & Industry',
  'Healthcare & Society',
];

export const HeroSearch: React.FC<HeroSearchProps> = ({
  onSelectSearch,
  selectedCategory,
  onSelectCategory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<IndicatorDefinition[]>([]);
  const [detectedIntent, setDetectedIntent] = useState<{ countryCode: string | null; countryName: string | null; topic: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setDetectedIntent(null);
      return;
    }

    const intent = dataProviderRegistry.parseSearchIntent(searchTerm);
    setDetectedIntent(intent);

    const matches = searchIndicators(intent.topic || searchTerm, selectedCategory === 'All' ? undefined : selectedCategory);
    setSuggestions(matches.slice(0, 6));
    setIsOpen(true);
  }, [searchTerm, selectedCategory]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExecuteSearch = (indicator?: IndicatorDefinition) => {
    const target = indicator || suggestions[0] || POPULAR_INDICATORS[0];
    const country = detectedIntent?.countryCode || target.defaultCountryCode || 'WLD';
    setIsOpen(false);
    onSelectSearch(target.id, country);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSearch();
    }
  };

  return (
    <section className="relative pt-12 pb-16 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Anti-slop zero-pill clean metadata kicker */}
        <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-4 tracking-wide uppercase">
          <Globe2 className="w-3.5 h-3.5" />
          <span>Real Public Statistical Datasets</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Zero Fabricated Data</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>World Bank v2 Standard</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 text-balance">
          Explore Global Market Data & Statistics
        </h1>
        
        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 text-balance">
          Search thousands of public indicators and transform raw data into interactive insights, charts and reports.
        </p>

        {/* Primary Search Container */}
        <div ref={searchRef} className="relative max-w-3xl mx-auto mb-6">
          <div className="relative flex items-center bg-slate-900 border border-slate-700 hover:border-slate-600 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 rounded-xl shadow-2xl transition-all">
            <div className="pl-4.5 pr-2 text-slate-400">
              <Search className="w-5 h-5 text-cyan-400" />
            </div>
            
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search an industry, country, indicator or topic (e.g., India GDP, Renewable energy, Internet users)..."
              className="w-full py-4 pr-3 text-sm sm:text-base text-white placeholder-slate-500 bg-transparent focus:outline-none"
            />

            <div className="pr-2">
              <button
                onClick={() => handleExecuteSearch()}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-md hover:shadow-cyan-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>Analyze Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time Country intent badge */}
          {detectedIntent?.countryName && (
            <div className="absolute -top-7 right-2 text-xs text-slate-400 flex items-center gap-1.5">
              <span>Target Country Detected:</span>
              <span className="font-semibold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                {detectedIntent.countryName} ({detectedIntent.countryCode})
              </span>
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-left divide-y divide-slate-800">
              <div className="px-4 py-2 text-xs font-mono text-slate-400 bg-slate-950/60 flex items-center justify-between">
                <span>Matching Public Indicators ({suggestions.length})</span>
                <span>Select to View Analysis</span>
              </div>
              {suggestions.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => handleExecuteSearch(ind)}
                  className="w-full px-4 py-3 hover:bg-slate-800/80 transition-colors flex items-start justify-between gap-4 text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white group-hover:text-cyan-400 transition-colors truncate">
                        {ind.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {ind.description}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>Code: {ind.id}</span>
                      <span>·</span>
                      <span>Source: {ind.source.split(',')[0]}</span>
                      <span>·</span>
                      <span>Unit: {ind.unit}</span>
                    </div>
                  </div>
                  <div className="shrink-0 pt-1 text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Popular Topic Prompt Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 mb-8">
          <span className="text-slate-500 font-medium">Popular Topics:</span>
          {POPULAR_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => onSelectSearch(p.indicatorId, p.countryCode)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Category Segmented Selector */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
};
