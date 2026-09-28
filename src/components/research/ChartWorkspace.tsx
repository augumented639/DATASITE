import React, { useState, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Download,
  FileSpreadsheet,
  Globe2,
  Info,
  Maximize2,
  Check,
} from 'lucide-react';
import { NormalizedDataPoint, IndicatorDefinition, CountryInfo, StatisticalSummary } from '../../types/data';
import { formatDataValue, generateForecast } from '../../services/statistics';
import { MAJOR_COUNTRIES, REGIONS_LIST } from '../../services/countryCatalog';

interface ChartWorkspaceProps {
  dataPoints: NormalizedDataPoint[];
  peerDataPoints: NormalizedDataPoint[];
  regionalDataPoints: NormalizedDataPoint[];
  indicator: IndicatorDefinition;
  country: CountryInfo;
  summary: StatisticalSummary | null;
  selectedPeerCodes: string[];
  onTogglePeerCountry: (code: string) => void;
  isLoadingPeers: boolean;
}

type ChartTab = 'trend' | 'compare' | 'forecast' | 'map' | 'regions';

export const ChartWorkspace: React.FC<ChartWorkspaceProps> = ({
  dataPoints,
  peerDataPoints,
  regionalDataPoints,
  indicator,
  country,
  summary,
  selectedPeerCodes,
  onTogglePeerCountry,
  isLoadingPeers,
}) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('trend');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [timeRange, setTimeRange] = useState<'5Y' | '10Y' | '20Y' | 'ALL'>('ALL');
  const [forecastHorizon, setForecastHorizon] = useState<number>(4);
  const [forecastModel, setForecastModel] = useState<'holt_exponential_smoothing' | 'linear_regression'>('holt_exponential_smoothing');
  const [hoveredMapCountry, setHoveredMapCountry] = useState<string | null>(null);

  // Filter time range for historical data
  const filteredData = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) return [];
    const valid = dataPoints.filter(d => d.value !== null && !isNaN(d.value)).sort((a, b) => a.year - b.year);
    if (valid.length === 0) return [];

    const maxYear = valid[valid.length - 1].year;
    if (timeRange === '5Y') return valid.filter(d => d.year >= maxYear - 5);
    if (timeRange === '10Y') return valid.filter(d => d.year >= maxYear - 10);
    if (timeRange === '20Y') return valid.filter(d => d.year >= maxYear - 20);
    return valid;
  }, [dataPoints, timeRange]);

  // Forecast data generation
  const forecastData = useMemo(() => {
    if (!dataPoints || dataPoints.length < 3) return [];
    const forecasts = generateForecast(dataPoints, forecastHorizon, forecastModel);
    
    // Merge last 5 historical years with forecast for seamless visual continuity
    const validHist = dataPoints.filter(d => d.value !== null).sort((a, b) => a.year - b.year);
    const recentHist = validHist.slice(-8);

    const merged = [
      ...recentHist.map(d => ({
        year: d.year,
        actual: d.value,
        forecast: null as number | null,
        lower: null as number | null,
        upper: null as number | null,
        type: 'Actual Historical Data',
      })),
    ];

    // Connect last actual to forecast start
    const lastActual = recentHist[recentHist.length - 1];
    if (lastActual) {
      // Add first forecast item anchor
      forecasts.forEach((f, idx) => {
        merged.push({
          year: f.year,
          actual: null,
          forecast: f.forecastValue,
          lower: f.lowerConfidence,
          upper: f.upperConfidence,
          type: 'Model-Generated Projection',
        });
      });
    }

    return merged;
  }, [dataPoints, forecastHorizon, forecastModel]);

  // Peer comparison data (latest available year comparison)
  const peerComparisonData = useMemo(() => {
    const list: { country: string; code: string; value: number; year: number }[] = [];
    
    // Add current country
    if (summary) {
      list.push({
        country: country.name,
        code: country.code,
        value: summary.latestValue,
        year: summary.latestYear,
      });
    }

    // Add selected peers
    selectedPeerCodes.forEach(code => {
      if (code === country.code) return;
      const peerPoints = peerDataPoints
        .filter(d => d.countryCode === code && d.value !== null)
        .sort((a, b) => b.year - a.year);

      if (peerPoints.length > 0) {
        list.push({
          country: peerPoints[0].country,
          code: peerPoints[0].countryCode,
          value: peerPoints[0].value!,
          year: peerPoints[0].year,
        });
      }
    });

    return list.sort((a, b) => b.value - a.value);
  }, [summary, country, selectedPeerCodes, peerDataPoints]);

  // Regional breakdown data
  const regionalChartData = useMemo(() => {
    if (!regionalDataPoints || regionalDataPoints.length === 0) return [];
    
    // Get latest year point for each region
    const byRegion = new Map<string, { region: string; code: string; value: number; year: number }>();
    regionalDataPoints.forEach(d => {
      if (d.value !== null && (!byRegion.has(d.countryCode) || d.year > byRegion.get(d.countryCode)!.year)) {
        byRegion.set(d.countryCode, {
          region: d.country,
          code: d.countryCode,
          value: d.value,
          year: d.year,
        });
      }
    });

    return Array.from(byRegion.values()).sort((a, b) => b.value - a.value);
  }, [regionalDataPoints]);

  // Export handlers
  const handleExportCSV = () => {
    if (!dataPoints.length) return;
    const headers = 'Year,Country,CountryCode,Indicator,IndicatorCode,Value,Unit,Source\n';
    const rows = dataPoints
      .map(d => `${d.year},"${d.country}","${d.countryCode}","${d.indicator}","${d.indicatorCode}",${d.value ?? ''},"${d.unit}","${d.source}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${indicator.id}_${country.code}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!dataPoints.length) return;
    const blob = new Blob([JSON.stringify({ indicator, country, summary, data: dataPoints }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${indicator.id}_${country.code}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
      
      {/* Chart Workspace Header & Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'trend'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Historical Trend</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'compare'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Country Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'forecast'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Model Projections</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>World Map Distribution</span>
          </button>

          {regionalChartData.length > 0 && (
            <button
              onClick={() => setActiveTab('regions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'regions'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Regional Aggregates</span>
            </button>
          )}
        </div>

        {/* Action Controls & Data Exports */}
        <div className="flex items-center gap-2">
          {activeTab === 'trend' && (
            <>
              {/* Chart type toggle */}
              <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    chartType === 'area' ? 'bg-slate-800 text-white font-semibold' : 'hover:text-slate-200'
                  }`}
                >
                  Area
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    chartType === 'line' ? 'bg-slate-800 text-white font-semibold' : 'hover:text-slate-200'
                  }`}
                >
                  Line
                </button>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400">
                {(['5Y', '10Y', '20Y', 'ALL'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      timeRange === r ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Export Buttons */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Download CSV dataset"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Download JSON dataset"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: HISTORICAL TREND */}
      {activeTab === 'trend' && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
            <div>
              <span className="font-semibold text-slate-200">{country.name}</span>
              <span className="mx-2">·</span>
              <span>Unit: {indicator.unit}</span>
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              {filteredData.length} valid data points displayed
            </div>
          </div>

          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="year"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => formatDataValue(val, indicator.formatType, indicator.unit)}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatDataValue(Number(val), indicator.formatType, indicator.unit), indicator.name]}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={country.name}
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                    dot={{ r: 3, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="year"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => formatDataValue(val, indicator.formatType, indicator.unit)}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatDataValue(Number(val), indicator.formatType, indicator.unit), indicator.name]}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={country.name}
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 2: COUNTRY COMPARISON */}
      {activeTab === 'compare' && (
        <div>
          {/* Peer Country Selection Chips */}
          <div className="mb-6 p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
              <span>Select Peer Economies to Compare (Latest Observation):</span>
              {isLoadingPeers && <span className="text-cyan-400 animate-pulse">Fetching peer datasets...</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {MAJOR_COUNTRIES.slice(0, 16).map(c => {
                const isSelected = selectedPeerCodes.includes(c.code) || c.code === country.code;
                const isCurrent = c.code === country.code;

                return (
                  <button
                    key={c.code}
                    onClick={() => !isCurrent && onTogglePeerCountry(c.code)}
                    disabled={isCurrent}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300 font-bold'
                        : isSelected
                        ? 'bg-slate-800 border-slate-600 text-white font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                    <span>{c.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">({c.code})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={peerComparisonData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(val) => formatDataValue(val, indicator.formatType, indicator.unit)}
                  tickLine={false}
                />
                <YAxis
                  dataKey="country"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${formatDataValue(Number(val), indicator.formatType, indicator.unit)} (Observed ${item.payload.year})`,
                    indicator.name,
                  ]}
                />
                <Bar
                  dataKey="value"
                  fill="#06b6d4"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 3: MODEL PROJECTION & FORECAST */}
      {activeTab === 'forecast' && (
        <div>
          {/* Method and Horizon Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-medium">Projection Method:</span>
              <select
                value={forecastModel}
                onChange={(e) => setForecastModel(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-white rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="holt_exponential_smoothing">Holt's Damped Trend Exponential Smoothing</option>
                <option value="linear_regression">Ordinary Least Squares (OLS) Linear Regression</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Horizon:</span>
              {[2, 3, 4, 5, 7].map(yrs => (
                <button
                  key={yrs}
                  onClick={() => setForecastHorizon(yrs)}
                  className={`px-2 py-0.5 rounded-md font-mono transition-colors ${
                    forecastHorizon === yrs ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  +{yrs}Y
                </button>
              ))}
            </div>
          </div>

          {/* Model Estimate Legal Notice Badge */}
          <div className="flex items-start gap-2.5 p-3 mb-4 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Model-Generated Estimate Notice: </span>
              Values from {summary ? summary.latestYear + 1 : 2025} onward are mathematical projections calculated via {forecastModel === 'holt_exponential_smoothing' ? 'Holt-Winters double exponential smoothing with damping' : 'linear regression trend'}. They represent statistical extrapolations with 95% confidence intervals, not official public statistical data.
            </div>
          </div>

          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => formatDataValue(val, indicator.formatType, indicator.unit)}
                  width={70}
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
                    if (val === null || val === undefined) return ['N/A', name];
                    return [formatDataValue(Number(val), indicator.formatType, indicator.unit), name];
                  }}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                
                {/* Confidence Interval Band */}
                <Area
                  type="monotone"
                  dataKey="upper"
                  name="95% Upper Bound"
                  stroke="#f59e0b"
                  strokeDasharray="2 2"
                  fill="url(#forecastBand)"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  name="95% Lower Bound"
                  stroke="#f59e0b"
                  strokeDasharray="2 2"
                  fill="transparent"
                />

                {/* Actual Historical Line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Official Historical Series"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06b6d4' }}
                />

                {/* Projected Dotted Line */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Model Forecast Mean"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#f59e0b' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 4: WORLD MAP DISTRIBUTION */}
      {activeTab === 'map' && (
        <div>
          <div className="text-xs text-slate-400 mb-4 flex items-center justify-between">
            <span>Global Country Intensity Map for <strong className="text-white">{indicator.name}</strong></span>
            <span className="font-mono text-cyan-400">{hoveredMapCountry ? `Hovered: ${hoveredMapCountry}` : 'Hover over regions to inspect'}</span>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center">
            {/* SVG Choropleth / World Map Visual Grid */}
            <div className="w-full max-w-4xl py-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {peerComparisonData.map((item) => (
                  <div
                    key={item.code}
                    onMouseEnter={() => setHoveredMapCountry(`${item.country} (${formatDataValue(item.value, indicator.formatType, indicator.unit)})`)}
                    onMouseLeave={() => setHoveredMapCountry(null)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      item.code === country.code
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-mono text-[10px]">{item.code}</span>
                      <span className="text-[10px] text-slate-500">{item.year}</span>
                    </div>
                    <div className="font-semibold text-xs text-white truncate mb-1">
                      {item.country}
                    </div>
                    <div className="font-mono text-sm font-bold text-cyan-400">
                      {formatDataValue(item.value, indicator.formatType, indicator.unit)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: REGIONAL AGGREGATES */}
      {activeTab === 'regions' && (
        <div>
          <div className="text-xs text-slate-400 mb-4">
            World Bank Regional Aggregates (Latest Reporting Year)
          </div>

          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regionalChartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(val) => formatDataValue(val, indicator.formatType, indicator.unit)}
                  tickLine={false}
                />
                <YAxis
                  dataKey="region"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${formatDataValue(Number(val), indicator.formatType, indicator.unit)} (Observed ${item.payload.year})`,
                    indicator.name,
                  ]}
                />
                <Bar
                  dataKey="value"
                  fill="#38bdf8"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
