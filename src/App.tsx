import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/layout/Navbar';
import { HeroSearch } from './components/home/HeroSearch';
import { FeaturedTopicsGrid } from './components/home/FeaturedTopicsGrid';
import { ReportHeader } from './components/research/ReportHeader';
import { KpiCards } from './components/research/KpiCards';
import { ChartWorkspace } from './components/research/ChartWorkspace';
import { FactualInsightsSection } from './components/research/FactualInsightsSection';
import { DataTableSection } from './components/research/DataTableSection';
import { DataSourcePanel } from './components/research/DataSourcePanel';
import { CountryCompareView } from './components/compare/CountryCompareView';
import { ReportBuilderView } from './components/reports/ReportBuilderView';
import { MethodologyView } from './components/methodology/MethodologyView';
import { WorkspaceView } from './components/workspace/WorkspaceView';
import { QuickSearchModal } from './components/common/QuickSearchModal';

import { dataProviderRegistry } from './services/providers/ProviderRegistry';
import { findIndicatorById, POPULAR_INDICATORS } from './services/indicatorCatalog';
import { getCountryByCode, MAJOR_COUNTRIES, REGIONS_LIST } from './services/countryCatalog';
import { calculateStatisticalSummary, generateFactualInsights } from './services/statistics';
import { NormalizedDataPoint, IndicatorDefinition, CountryInfo, StatisticalSummary, FactualInsight } from './types/data';
import { AlertCircle, RefreshCw, Database, ShieldCheck, Globe } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'research' | 'compare' | 'reports' | 'methodology' | 'workspace'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [indicatorId, setIndicatorId] = useState<string>('NY.GDP.MKTP.CD');
  const [countryCode, setCountryCode] = useState<string>('IND');
  const [selectedPeers, setSelectedPeers] = useState<string[]>(['USA', 'CHN', 'DEU', 'GBR', 'JPN', 'WLD']);

  // Data states
  const [dataPoints, setDataPoints] = useState<NormalizedDataPoint[]>([]);
  const [peerDataPoints, setPeerDataPoints] = useState<NormalizedDataPoint[]>([]);
  const [regionalDataPoints, setRegionalDataPoints] = useState<NormalizedDataPoint[]>([]);
  const [retrievedAt, setRetrievedAt] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingPeers, setIsLoadingPeers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Workspace & bookmarks in localStorage
  const [savedItems, setSavedItems] = useState<{ indicatorId: string; countryCode: string; addedAt: string }[]>(() => {
    try {
      const stored = localStorage.getItem('omnistat_saved_items');
      return stored ? JSON.parse(stored) : [
        { indicatorId: 'NY.GDP.MKTP.CD', countryCode: 'IND', addedAt: new Date().toISOString() },
        { indicatorId: 'IT.NET.USER.ZS', countryCode: 'USA', addedAt: new Date().toISOString() },
        { indicatorId: 'EG.ELC.RNEW.ZS', countryCode: 'WLD', addedAt: new Date().toISOString() },
      ];
    } catch {
      return [];
    }
  });

  // Recent searches in localStorage
  const [recentSearches, setRecentSearches] = useState<{ query: string; indicatorId: string; countryCode: string; timestamp: string }[]>(() => {
    try {
      const stored = localStorage.getItem('omnistat_recent_searches');
      return stored ? JSON.parse(stored) : [
        { query: 'India GDP', indicatorId: 'NY.GDP.MKTP.CD', countryCode: 'IND', timestamp: new Date().toISOString() },
        { query: 'Internet Users', indicatorId: 'IT.NET.USER.ZS', countryCode: 'WLD', timestamp: new Date().toISOString() },
      ];
    } catch {
      return [];
    }
  });

  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  // Sync saved items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omnistat_saved_items', JSON.stringify(savedItems));
    } catch {
      // ignore
    }
  }, [savedItems]);

  // Sync recent searches to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omnistat_recent_searches', JSON.stringify(recentSearches));
    } catch {
      // ignore
    }
  }, [recentSearches]);

  // Keyboard shortcut '/' to open quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isQuickSearchOpen && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        setIsQuickSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickSearchOpen]);

  // Fetch primary country dataset
  const fetchIndicatorData = useCallback(async (indCode: string, cCode: string, bypassCache = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await dataProviderRegistry.fetchHistoricalData({
        indicatorCode: indCode,
        countryCodes: [cCode],
        startYear: 1960,
        endYear: 2026,
      }, bypassCache);

      if (result.data.length === 0) {
        setError('Data not available from the connected public sources for this country.');
        setDataPoints([]);
      } else {
        setDataPoints(result.data);
        setSourceUrl(result.sourceUrl);
        setRetrievedAt(result.retrievedAt);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err?.message || 'Unable to retrieve data from this public source.');
      setDataPoints([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch peer economies for comparisons & regional aggregates
  const fetchPeerAndRegionalData = useCallback(async (indCode: string, peers: string[]) => {
    setIsLoadingPeers(true);
    try {
      // Peer countries
      const peerResult = await dataProviderRegistry.fetchHistoricalData({
        indicatorCode: indCode,
        countryCodes: peers,
        startYear: 2010,
        endYear: 2026,
      });
      setPeerDataPoints(peerResult.data);

      // Regional codes
      const regionCodes = REGIONS_LIST.map(r => r.code);
      const regionalResult = await dataProviderRegistry.fetchHistoricalData({
        indicatorCode: indCode,
        countryCodes: regionCodes,
        startYear: 2015,
        endYear: 2026,
      });
      setRegionalDataPoints(regionalResult.data);
    } catch (err) {
      console.warn('Peer/regional fetch warning:', err);
    } finally {
      setIsLoadingPeers(false);
    }
  }, []);

  // Trigger data fetch on selection
  useEffect(() => {
    fetchIndicatorData(indicatorId, countryCode);
    fetchPeerAndRegionalData(indicatorId, selectedPeers);
  }, [indicatorId, countryCode, fetchIndicatorData, fetchPeerAndRegionalData, selectedPeers]);

  // Current metadata objects
  const currentIndicator: IndicatorDefinition = useMemo(() => {
    return findIndicatorById(indicatorId) || {
      id: indicatorId,
      name: indicatorId,
      category: 'Macroeconomics & GDP',
      unit: 'Units',
      description: 'Official statistical series from World Bank and open statistical data APIs.',
      source: 'World Bank Open Data',
      sourceUrl: `https://data.worldbank.org/indicator/${indicatorId}`,
      provider: 'World Bank',
      defaultCountryCode: 'WLD',
      tags: [],
    };
  }, [indicatorId]);

  const currentCountry: CountryInfo = useMemo(() => {
    return getCountryByCode(countryCode) || {
      code: countryCode,
      name: countryCode,
      region: 'Global',
    };
  }, [countryCode]);

  // Summary statistics calculation
  const summary: StatisticalSummary | null = useMemo(() => {
    return calculateStatisticalSummary(dataPoints, retrievedAt);
  }, [dataPoints, retrievedAt]);

  // Factual insights calculation
  const insights: FactualInsight[] = useMemo(() => {
    if (!summary) return [];
    return generateFactualInsights(summary, currentIndicator, currentCountry.name);
  }, [summary, currentIndicator, currentCountry]);

  // Navigation and selection handlers
  const handleSelectIndicatorAndCountry = (newIndId: string, newCountryCode: string) => {
    setIndicatorId(newIndId);
    setCountryCode(newCountryCode);
    setActiveTab('research');

    // Add to recent searches
    const indObj = findIndicatorById(newIndId);
    const countryObj = getCountryByCode(newCountryCode);
    const queryLabel = `${countryObj?.name || newCountryCode} ${indObj?.name || newIndId}`;
    
    setRecentSearches(prev => [
      { query: queryLabel, indicatorId: newIndId, countryCode: newCountryCode, timestamp: new Date().toISOString() },
      ...prev.filter(r => !(r.indicatorId === newIndId && r.countryCode === newCountryCode)).slice(0, 9),
    ]);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleBookmark = () => {
    const isExisting = savedItems.some(item => item.indicatorId === indicatorId && item.countryCode === countryCode);
    if (isExisting) {
      setSavedItems(prev => prev.filter(item => !(item.indicatorId === indicatorId && item.countryCode === countryCode)));
    } else {
      setSavedItems(prev => [
        { indicatorId, countryCode, addedAt: new Date().toISOString() },
        ...prev,
      ]);
    }
  };

  const isBookmarked = savedItems.some(item => item.indicatorId === indicatorId && item.countryCode === countryCode);

  const handleTogglePeerCountry = (peerCode: string) => {
    setSelectedPeers(prev => {
      if (prev.includes(peerCode)) {
        return prev.filter(p => p !== peerCode);
      } else {
        return [...prev, peerCode];
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Universal 3-Zone Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onNavigate={(tab, indId, cCode) => {
          if (indId && cCode) {
            handleSelectIndicatorAndCountry(indId, cCode);
          } else {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        savedCount={savedItems.length}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
      />

      {/* Main View Port Routing */}
      <main className="flex-1">
        
        {/* VIEW 1: HOME & DISCOVERY */}
        {activeTab === 'home' && (
          <div>
            <HeroSearch
              onSelectSearch={handleSelectIndicatorAndCountry}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <FeaturedTopicsGrid
              selectedCategory={selectedCategory}
              onSelectIndicator={handleSelectIndicatorAndCountry}
            />
          </div>
        )}

        {/* VIEW 2: RESEARCH ANALYSIS WORKSPACE */}
        {activeTab === 'research' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Report Header & Quick Controls */}
            <ReportHeader
              indicator={currentIndicator}
              country={currentCountry}
              summary={summary}
              isBookmarked={isBookmarked}
              onToggleBookmark={handleToggleBookmark}
              onRefresh={() => fetchIndicatorData(indicatorId, countryCode, true)}
              isLoading={isLoading}
              onSelectCountry={(newCode) => handleSelectIndicatorAndCountry(indicatorId, newCode)}
              onExportReport={() => setActiveTab('reports')}
            />

            {/* Error State Banner */}
            {error && (
              <div className="p-6 bg-rose-950/40 border border-rose-800/80 rounded-2xl mb-8 flex items-start gap-4 text-rose-200">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-white mb-1">
                    {error}
                  </h3>
                  <p className="text-xs text-rose-300 mb-3">
                    The requested dataset might not have public reporting for {currentCountry.name} ({currentCountry.code}) in the World Bank repository.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchIndicatorData(indicatorId, countryCode, true)}
                      className="px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Retry Connection
                    </button>
                    <button
                      onClick={() => handleSelectIndicatorAndCountry(indicatorId, 'WLD')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Try World Aggregate (WLD)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Primary KPI Metrics */}
            <KpiCards summary={summary} indicator={currentIndicator} />

            {/* Interactive Chart Workspace (Trends, Comparisons, Forecasts, World Map) */}
            <ChartWorkspace
              dataPoints={dataPoints}
              peerDataPoints={peerDataPoints}
              regionalDataPoints={regionalDataPoints}
              indicator={currentIndicator}
              country={currentCountry}
              summary={summary}
              selectedPeerCodes={selectedPeers}
              onTogglePeerCountry={handleTogglePeerCountry}
              isLoadingPeers={isLoadingPeers}
            />

            {/* Factual Insights Section */}
            {insights.length > 0 && (
              <FactualInsightsSection
                insights={insights}
                countryName={currentCountry.name}
                indicatorName={currentIndicator.name}
              />
            )}

            {/* Full Sortable & Searchable Data Table */}
            <DataTableSection
              dataPoints={dataPoints}
              indicator={currentIndicator}
              countryName={currentCountry.name}
            />

            {/* Data Source & Academic Citation Panel */}
            <DataSourcePanel
              indicator={currentIndicator}
              country={currentCountry}
              summary={summary}
              sourceUrl={sourceUrl}
              retrievedAt={retrievedAt}
            />

          </div>
        )}

        {/* VIEW 3: COUNTRY COMPARISON BENCHMARK */}
        {activeTab === 'compare' && (
          <CountryCompareView
            onSelectIndicator={handleSelectIndicatorAndCountry}
          />
        )}

        {/* VIEW 4: CUSTOM REPORT GENERATOR */}
        {activeTab === 'reports' && (
          <ReportBuilderView
            initialIndicatorId={indicatorId}
            initialCountryCode={countryCode}
          />
        )}

        {/* VIEW 5: METHODOLOGY & SCIENTIFIC STANDARDS */}
        {activeTab === 'methodology' && (
          <MethodologyView />
        )}

        {/* VIEW 6: PERSONAL ANALYST WORKSPACE */}
        {activeTab === 'workspace' && (
          <WorkspaceView
            savedItems={savedItems}
            recentSearches={recentSearches}
            onRemoveBookmark={(indId, cCode) => {
              setSavedItems(prev => prev.filter(item => !(item.indicatorId === indId && item.countryCode === cCode)));
            }}
            onClearRecentSearches={() => setRecentSearches([])}
            onOpenAnalysis={handleSelectIndicatorAndCountry}
          />
        )}

      </main>

      {/* Global Quick Search Command Palette */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onSelect={handleSelectIndicatorAndCountry}
      />

      {/* Anti-Slop Clean Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-500" />
            <span className="font-bold text-slate-300">OmniData Intelligence</span>
            <span>— Global Market Statistics & Data Explorer</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <button onClick={() => setActiveTab('methodology')} className="hover:text-white transition-colors cursor-pointer">
              Methodology & APIs
            </button>
            <button onClick={() => setActiveTab('reports')} className="hover:text-white transition-colors cursor-pointer">
              Report Builder
            </button>
            <a
              href="https://data.worldbank.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              World Bank Open Data
            </a>
          </div>

          <div className="font-mono text-[11px] text-slate-600">
            CC BY 4.0 Open Data Attribution
          </div>
        </div>
      </footer>

    </div>
  );
}
