import React from 'react';
import { Database, Search, Bookmark, BarChart3, Globe2, FileText, HelpCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'research' | 'compare' | 'reports' | 'methodology' | 'workspace';
  onNavigate: (tab: 'home' | 'research' | 'compare' | 'reports' | 'methodology' | 'workspace', indicatorId?: string, countryCode?: string) => void;
  savedCount: number;
  onOpenQuickSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  savedCount,
  onOpenQuickSearch,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element Brand Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg py-1 px-1.5"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              OmniData Intelligence
            </span>
          </div>
        </button>

        {/* Zone 2: 4-6 Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-2 rounded-md transition-colors ${
              activeTab === 'home'
                ? 'text-white bg-slate-900 font-semibold'
                : 'hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            Explore Data
          </button>
          <button
            onClick={() => onNavigate('compare')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'compare'
                ? 'text-white bg-slate-900 font-semibold'
                : 'hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            Country Benchmark
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'text-white bg-slate-900 font-semibold'
                : 'hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Report Builder
          </button>
          <button
            onClick={() => onNavigate('methodology')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'methodology'
                ? 'text-white bg-slate-900 font-semibold'
                : 'hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Methodology
          </button>
          <button
            onClick={() => onNavigate('workspace')}
            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'workspace'
                ? 'text-white bg-slate-900 font-semibold'
                : 'hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Workspace
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenQuickSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
            title="Search dataset or country"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Search Indicators...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-950 text-slate-500 border border-slate-800 rounded">
              /
            </kbd>
          </button>
          
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pl-2 border-l border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>WB API v2 Connected</span>
          </div>
        </div>

      </div>
    </header>
  );
};
