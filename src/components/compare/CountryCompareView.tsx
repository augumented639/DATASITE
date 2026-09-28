import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Globe2, Plus, X, ArrowUpDown, Layers, Sliders, Check, TrendingUp, RefreshCw } from 'lucide-react';
import { MAJOR_COUNTRIES } from '../../services/countryCatalog';
import { POPULAR_INDICATORS } from '../../services/indicatorCatalog';
import { dataProviderRegistry } from '../../services/providers/ProviderRegistry';
import { NormalizedDataPoint, IndicatorDefinition, CountryInfo } from '../../types/data';
import { formatDataValue } from '../../services/statistics';

const COUNTRY_COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

export const CountryCompareView: React.FC<{
  onSelectIndicator: (id: string, country: string) => void;
}> = ({ onSelectIndicator }) => {
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>(POPULAR_INDICATORS[0].id);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['USA', 'CHN', 'IND', 'DEU', 'JPN']);
  const [dataPoints, setDataPoints] = useState<NormalizedDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'absolute' | 'indexed'>('absolute'); // absolute vs rebased base 100

  const activeIndicator = useMemo(() => {
    return POPULAR_INDICATORS.find(ind => ind.id === selectedIndicatorId) || POPULAR_INDICATORS[0];
  }, [selectedIndicatorId]);

  // Fetch comparison data whenever indicator or country selection changes
  useEffect(() => {
    let isCancelled = false;
    const fetchData = async () => {
      if (selectedCountries.length === 0) {
        setDataPoints([]);
        return;
      }

      setIsLoading(true);
      try {
        const result = await dataProviderRegistry.fetchHistoricalData({
          indicatorCode: selectedIndicatorId,
          countryCodes: selectedCountries,
          startYear: 2000,
          endYear: 2026,
        });

        if (!isCancelled) {
          setDataPoints(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch multi-country comparison data:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [selectedIndicatorId, selectedCountries]);

  // Transform into time-series chart format
  const chartData = useMemo(() => {
    if (dataPoints.length === 0) return [];

    // Group by year
    const yearMap = new Map<number, any>();
    
    // Find base value for indexing (year ~2005 or first available)
    const baseValues = new Map<string, number>();
    if (viewMode === 'indexed') {
      selectedCountries.forEach(cCode => {
        const countryPts = dataPoints
          .filter(d => d.countryCode === cCode && d.value !== null && d.value > 0)
          .sort((a, b) => a.year - b.year);
        if (countryPts.length > 0) {
          baseValues.set(cCode, countryPts[0].value!);
        }
      });
    }

    dataPoints.forEach(pt => {
      if (pt.value === null) return;
      if (!yearMap.has(pt.year)) {
        yearMap.set(pt.year, { year: pt.year });
      }
      const entry = yearMap.get(pt.year);
      
      if (viewMode === 'indexed') {
        const base = baseValues.get(pt.countryCode);
        entry[pt.countryCode] = base ? Number(((pt.value / base) * 100).toFixed(2)) : null;
      } else {
        entry[pt.countryCode] = pt.value;
      }
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [dataPoints, selectedCountries, viewMode]);

  // Latest snapshot comparison bar data
  const snapshotData = useMemo(() => {
    return selectedCountries.map(cCode => {
      const pts = dataPoints
        .filter(d => d.countryCode === cCode && d.value !== null)
        .sort((a, b) => b.year - a.year);

      const countryObj = MAJOR_COUNTRIES.find(c => c.code === cCode);

      return {
        code: cCode,
        country: countryObj?.name || cCode,
        latestValue: pts.length > 0 ? pts[0].value! : null,
        latestYear: pts.length > 0 ? pts[0].year : null,
      };
    }).sort((a, b) => (b.latestValue ?? -Infinity) - (a.latestValue ?? -Infinity));
  }, [dataPoints, selectedCountries]);

  const toggleCountry = (code: string) => {
    if (selectedCountries.includes(code)) {
      if (selectedCountries.length > 1) {
        setSelectedCountries(selectedCountries.filter(c => c !== code));
      }
    } else {
      if (selectedCountries.length < 8) {
        setSelectedCountries([...selectedCountries, code]);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2 uppercase">
          <Globe2 className="w-3.5 h-3.5" />
          <span>Cross-Country Comparative Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Country Benchmark & Velocity Matrix
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Directly compare trajectory, growth velocity, and current positions between peer economies.
        </p>
      </div>

      {/* Selector Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Indicator Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            1. Select Public Indicator:
          </label>
          <select
            value={selectedIndicatorId}
            onChange={(e) => setSelectedIndicatorId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-xs font-semibold text-white rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            {POPULAR_INDICATORS.map(ind => (
              <option key={ind.id} value={ind.id}>
                {ind.name} ({ind.category})
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Unit: {activeIndicator.unit} · Provider: {activeIndicator.provider}
          </span>
        </div>

        {/* Peer Country Selection Matrix */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300">
              2. Select Countries to Compare ({selectedCountries.length} / 8):
            </label>
            {isLoading && <span className="text-xs font-mono text-cyan-400 animate-pulse">Syncing API...</span>}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {MAJOR_COUNTRIES.map(c => {
              const isSelected = selectedCountries.includes(c.code);
              return (
                <button
                  key={c.code}
                  onClick={() => toggleCountry(c.code)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Main Multi-Line Comparison Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">
              {activeIndicator.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {viewMode === 'indexed' ? 'Indexed Growth Velocity (Base Year = 100)' : `Absolute Values (${activeIndicator.unit})`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('absolute')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'absolute' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Absolute Scale
              </button>
              <button
                onClick={() => setViewMode('indexed')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'indexed' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Indexed (Base 100)
              </button>
            </div>
          </div>
        </div>

        <div className="h-80 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                tickFormatter={(val) => viewMode === 'indexed' ? `${val}` : formatDataValue(val, activeIndicator.formatType, activeIndicator.unit)}
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: any) => {
                  const countryName = MAJOR_COUNTRIES.find(c => c.code === name)?.name || name;
                  if (val === null || val === undefined) return ['N/A', countryName];
                  const formatted = viewMode === 'indexed' ? `${val} (Index pts)` : formatDataValue(Number(val), activeIndicator.formatType, activeIndicator.unit);
                  return [formatted, countryName];
                }}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              {selectedCountries.map((cCode, idx) => {
                const countryName = MAJOR_COUNTRIES.find(c => c.code === cCode)?.name || cCode;
                const color = COUNTRY_COLORS[idx % COUNTRY_COLORS.length];
                return (
                  <Line
                    key={cCode}
                    type="monotone"
                    dataKey={cCode}
                    name={countryName}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Snapshot Country Ranking Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">
            Latest Recorded Observation Benchmark
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snapshotData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(val) => formatDataValue(val, activeIndicator.formatType, activeIndicator.unit)}
                />
                <YAxis dataKey="country" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${formatDataValue(Number(val), activeIndicator.formatType, activeIndicator.unit)} (${item.payload.latestYear})`,
                    activeIndicator.name,
                  ]}
                />
                <Bar dataKey="latestValue" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Launch Analysis Cards */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">
              Deep Dive by Country
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Open comprehensive report view with forecasting and historical tables for any selected economy.
            </p>
            <div className="space-y-2">
              {snapshotData.slice(0, 5).map(item => (
                <button
                  key={item.code}
                  onClick={() => onSelectIndicator(selectedIndicatorId, item.code)}
                  className="w-full p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {item.country}
                    </span>
                    <span className="block text-[11px] font-mono text-cyan-400">
                      {formatDataValue(item.latestValue, activeIndicator.formatType, activeIndicator.unit)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {item.latestYear} →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
