import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Globe, Layers } from 'lucide-react';
import { POPULAR_INDICATORS } from '../../services/indicatorCatalog';
import { MAJOR_COUNTRIES } from '../../services/countryCatalog';
import { dataProviderRegistry } from '../../services/providers/ProviderRegistry';
import { IndicatorDefinition } from '../../types/data';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (indicatorId: string, countryCode: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<IndicatorDefinition[]>([]);
  const [detectedIntent, setDetectedIntent] = useState<{ countryCode: string | null; countryName: string | null; topic: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearchTerm('');
      setResults(POPULAR_INDICATORS.slice(0, 8));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults(POPULAR_INDICATORS.slice(0, 8));
      setDetectedIntent(null);
      return;
    }

    const intent = dataProviderRegistry.parseSearchIntent(searchTerm);
    setDetectedIntent(intent);

    const q = (intent.topic || searchTerm).toLowerCase().trim();
    const matches = POPULAR_INDICATORS.filter(
      ind =>
        ind.name.toLowerCase().includes(q) ||
        ind.id.toLowerCase().includes(q) ||
        ind.description.toLowerCase().includes(q) ||
        ind.tags.some(t => t.toLowerCase().includes(q))
    );
    setResults(matches.slice(0, 8));
  }, [searchTerm]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (ind: IndicatorDefinition) => {
    const country = detectedIntent?.countryCode || ind.defaultCountryCode || 'WLD';
    onSelect(ind.id, country);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800">
        
        {/* Search input header */}
        <div className="flex items-center px-4 py-3.5 gap-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search indicator, topic or country (e.g. India GDP, Renewable Energy, Internet Users)..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
          />
          {detectedIntent?.countryName && (
            <span className="shrink-0 text-xs font-semibold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded">
              {detectedIntent.countryName}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching public indicators found. Try searching general topics like "GDP", "Population", or "Energy".
            </div>
          ) : (
            results.map((ind) => (
              <button
                key={ind.id}
                onClick={() => handleSelect(ind)}
                className="w-full p-3 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start justify-between gap-4 text-left group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
                      {ind.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      ({ind.id})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {ind.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span>{ind.category}</span>
                    <span>·</span>
                    <span>{ind.provider}</span>
                    <span>·</span>
                    <span>{ind.unit}</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 shrink-0 mt-1" />
              </button>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-slate-950/60 text-xs text-slate-500 flex items-center justify-between font-mono">
          <span>Press ESC to close</span>
          <span>World Bank v2 Public API</span>
        </div>

      </div>
    </div>
  );
};
